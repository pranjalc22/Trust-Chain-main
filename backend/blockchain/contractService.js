// ============================================================
//  blockchain/contractService.js — Smart Contract Integration
// ============================================================
//  Connects to Escrow and Reputation contracts via ethers.js.
//  Listens to on-chain events and keeps PostgreSQL in sync.
//  Includes resilient reconnection with exponential backoff.
// ============================================================

require("dotenv").config();
const { ethers } = require("ethers");
const { User, Transaction, Dispute } = require("../models");

// Load ABIs
const escrowAbi = require("./abis/Escrow.json");
const reputationAbi = require("./abis/Reputation.json");

/**
 * Wraps a promise in a timeout to prevent RPC hangs.
 */
const withTimeout = (promise, ms = 2500, errorMsg = "Blockchain RPC request timed out") => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
  ]);
};

class ContractService {
  constructor() {
    this.provider = null;
    this.escrowContract = null;
    this.reputationContract = null;
    this.isListening = false;
    this.reconnectTimeout = null;
    this.retryDelayMs = 3000;
    this.maxRetryDelayMs = 30000;
  }

  /**
   * Initializes RPC provider and contract instances from environment variables.
   */
  async initialize() {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
    const reputationAddress = process.env.REPUTATION_CONTRACT_ADDRESS;

    if (!escrowAddress || !reputationAddress) {
      console.warn(
        "⚠️  [Blockchain] ESCROW_CONTRACT_ADDRESS or REPUTATION_CONTRACT_ADDRESS not configured in .env. Live blockchain event listener paused."
      );
      return false;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        staticNetwork: true,
      });

      // Verify connection with a strict timeout so server never hangs if node is down
      const blockNumber = await withTimeout(this.provider.getBlockNumber(), 2500);
      console.log(`🔗 [Blockchain] Connected to RPC (${rpcUrl}) at block #${blockNumber}`);

      this.escrowContract = new ethers.Contract(escrowAddress, escrowAbi, this.provider);
      this.reputationContract = new ethers.Contract(reputationAddress, reputationAbi, this.provider);

      // Reset retry delay on successful connection
      this.retryDelayMs = 3000;
      return true;
    } catch (error) {
      console.warn(`⚠️  [Blockchain] Cannot reach RPC at ${rpcUrl}: ${error.message}`);
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * Starts listening for Escrow contract events.
   */
  async startEventListeners() {
    if (this.isListening) return;
    if (!this.reconcileTimer) {
      const reconcile = async () => {
        if (this.reconciling) return;
        this.reconciling = true;
        try {
          if (!this.escrowContract && !await this.initialize()) return;
          const count = await this.escrowContract.transactionCount();
          for (let id = 0n; id < count; id++) {
            const t = await this.escrowContract.transactions(id);
            await this.handleTransactionCreated(id, t.buyer, t.seller, t.amount);
            if (Number(t.status) === 3) await this.handleDisputed(id, t.buyer);
            if ([2,4].includes(Number(t.status))) await this.handleResolved(id, Number(t.status) === 2);
          }
        } catch (err) { console.error("Reconciliation failed:", err.message); }
        finally { this.reconciling = false; }
      };
      this.reconcileTimer = setInterval(reconcile, 10000);
      this.reconcileTimer.unref();
      await reconcile();
    }

    const initialized = await this.initialize();
    if (!initialized) return;

    try {
      console.log("👂 [Blockchain] Attaching event listeners to Escrow contract...");

      // Event 1: TransactionCreated
      this.escrowContract.on(
        "TransactionCreated",
        async (transactionId, buyer, seller, amount, event) => {
          try {
            console.log(`📡 [Event] TransactionCreated: ID=${transactionId}, Buyer=${buyer}, Seller=${seller}`);
            await this.handleTransactionCreated(transactionId, buyer, seller, amount, event);
          } catch (err) {
            console.error("Error handling TransactionCreated event:", err);
          }
        }
      );

      // Event 2: Delivered
      this.escrowContract.on("Delivered", async (transactionId, event) => {
        try {
          console.log(`📡 [Event] Delivered: ID=${transactionId}`);
          await this.handleDelivered(transactionId, event);
        } catch (err) {
          console.error("Error handling Delivered event:", err);
        }
      });

      // Event 3: Completed
      this.escrowContract.on("Completed", async (transactionId, seller, amount, event) => {
        try {
          console.log(`📡 [Event] Completed: ID=${transactionId}, Seller=${seller}`);
          await this.handleCompleted(transactionId, seller, amount, event);
        } catch (err) {
          console.error("Error handling Completed event:", err);
        }
      });

      // Event 4: Disputed
      this.escrowContract.on("Disputed", async (transactionId, raisedBy, event) => {
        try {
          console.log(`📡 [Event] Disputed: ID=${transactionId}, RaisedBy=${raisedBy}`);
          await this.handleDisputed(transactionId, raisedBy, event);
        } catch (err) {
          console.error("Error handling Disputed event:", err);
        }
      });

      // Event 5: Resolved
      this.escrowContract.on("Resolved", async (transactionId, releasedToSeller, event) => {
        try {
          console.log(`📡 [Event] Resolved: ID=${transactionId}, ReleasedToSeller=${releasedToSeller}`);
          await this.handleResolved(transactionId, releasedToSeller, event);
        } catch (err) {
          console.error("Error handling Resolved event:", err);
        }
      });

      this.isListening = true;
      console.log("✅ [Blockchain] Live event listeners active.");
    } catch (error) {
      console.error(`❌ [Blockchain] Error attaching listeners: ${error.message}`);
      this.scheduleReconnect();
    }
  }

  /**
   * Cleans up listeners and schedules a retry with exponential backoff.
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.isListening = false;

    if (this.escrowContract) {
      try {
        this.escrowContract.removeAllListeners();
      } catch {}
    }

    this.reconnectTimeout = setTimeout(async () => {
      this.retryDelayMs = Math.min(this.retryDelayMs * 2, this.maxRetryDelayMs);
      await this.startEventListeners();
    }, this.retryDelayMs);
  }

  // ----------------------------------------------------------
  //  Event Handlers
  // ----------------------------------------------------------

  async handleTransactionCreated(transactionId, buyer, seller, amount, _event) {
    const onChainId = transactionId.toString();
    const buyerLower = buyer.toLowerCase();
    const sellerLower = seller.toLowerCase();
    const formattedAmount = ethers.formatEther(amount);
    const current = await this.getOnChainTransaction(onChainId);

    // Ensure buyer & seller exist in users table
    await User.findOrCreate({
      where: { wallet_address: buyerLower },
      defaults: { wallet_address: buyerLower, display_name: `Buyer ${buyerLower.slice(0, 6)}` },
    });
    await User.findOrCreate({
      where: { wallet_address: sellerLower },
      defaults: { wallet_address: sellerLower, display_name: `Seller ${sellerLower.slice(0, 6)}` },
    });

    // Check if a record already exists with this on_chain_tx_id
    const existing = await Transaction.findOne({ where: { on_chain_tx_id: onChainId } });
    if (existing) {
      await existing.update({
        status: current.status,
        amount: formattedAmount,
        updated_at: new Date(),
      });
      return existing;
    }

    // Otherwise create new record
    return await Transaction.create({
      buyer_wallet: buyerLower,
      seller_wallet: sellerLower,
      description: `On-chain Escrow Transaction #${onChainId}`,
      amount: formattedAmount,
      currency: "ETH",
      status: current.status,
      on_chain_tx_id: onChainId,
    });
  }

  async handleDelivered(transactionId, _event) {
    const onChainId = transactionId.toString();
    const tx = await Transaction.findOne({ where: { on_chain_tx_id: onChainId } });
    if (tx) {
      await tx.update({
        status: (await this.getOnChainTransaction(onChainId)).status,
        updated_at: new Date(),
      });
    }
  }

  async handleCompleted(transactionId, _seller, _amount, _event) {
    const onChainId = transactionId.toString();
    const tx = await Transaction.findOne({ where: { on_chain_tx_id: onChainId } });
    if (tx) {
      await tx.update({
        status: (await this.getOnChainTransaction(onChainId)).status,
        updated_at: new Date(),
      });
    }
  }

  async handleDisputed(transactionId, raisedBy, _event) {
    const onChainId = transactionId.toString();
    const raisedByLower = raisedBy.toLowerCase();
    const tx = await Transaction.findOne({ where: { on_chain_tx_id: onChainId } });

    if (tx) {
      await tx.update({
        status: (await this.getOnChainTransaction(onChainId)).status,
        updated_at: new Date(),
      });

      // Find or create dispute record
      const existingDispute = await Dispute.findOne({ where: { transaction_id: tx.id } });
      if (!existingDispute) {
        await Dispute.create({
          transaction_id: tx.id,
          raised_by: raisedByLower,
          status: "Open",
          evidence_buyer: raisedByLower === tx.buyer_wallet ? "Dispute flagged on-chain by buyer." : null,
          evidence_seller: raisedByLower === tx.seller_wallet ? "Dispute flagged on-chain by seller." : null,
        });
      }
    }
  }

  async handleResolved(transactionId, releasedToSeller, _event) {
    const onChainId = transactionId.toString();
    const tx = await Transaction.findOne({ where: { on_chain_tx_id: onChainId } });

    if (tx) {
      const newStatus = releasedToSeller ? "Completed" : "Refunded";
      await tx.update({
        status: newStatus,
        updated_at: new Date(),
      });

      const dispute = await Dispute.findOne({ where: { transaction_id: tx.id } });
      if (dispute) {
        await dispute.update({
          status: releasedToSeller ? "Resolved_Seller" : "Resolved_Buyer",
          resolution: releasedToSeller
            ? "Arbitrator resolved dispute on-chain: funds released to seller."
            : "Arbitrator resolved dispute on-chain: funds refunded to buyer.",
          updated_at: new Date(),
        });
      }
    }
  }

  // ----------------------------------------------------------
  //  Live On-Chain Read Methods
  // ----------------------------------------------------------

  /**
   * Reads live reputation score and statistics directly from the Reputation smart contract.
   * @param {string} walletAddress - Ethereum wallet address
   */
  async getOnChainReputation(walletAddress) {
    if (!this.reputationContract) {
      const ok = await this.initialize();
      if (!ok) {
        throw new Error("Reputation smart contract is not connected or not configured in .env.");
      }
    }

    const formattedAddress = ethers.getAddress(walletAddress);

    // Query score and reputation with timeout protection
    const scoreBigInt = await withTimeout(
      this.reputationContract.getReputationScore(formattedAddress),
      2500,
      "Reputation contract getReputationScore call timed out"
    );

    const repData = await withTimeout(
      this.reputationContract.getReputation(formattedAddress),
      2500,
      "Reputation contract getReputation call timed out"
    );

    const completedTransactions = Number(repData[0]);
    const disputesLost = Number(repData[1]);
    const disputesWon = Number(repData[2]);
    const totalRatingSum = Number(repData[3]);
    const ratingCount = Number(repData[4]);
    const averageRating = ratingCount > 0 ? +(totalRatingSum / ratingCount).toFixed(2) : 0;

    return {
      wallet_address: walletAddress.toLowerCase(),
      on_chain_score: Number(scoreBigInt),
      completed_transactions: completedTransactions,
      disputes_lost: disputesLost,
      disputes_won: disputesWon,
      total_ratings: ratingCount,
      average_rating: averageRating,
      verified_on_chain: true,
    };
  }

  /**
   * Reads live transaction details directly from the Escrow smart contract.
   * @param {string|number} onChainTxId
   */
  async getOnChainTransaction(onChainTxId) {
    if (!this.escrowContract) {
      const ok = await this.initialize();
      if (!ok) {
        throw new Error("Escrow smart contract is not connected or not configured.");
      }
    }

    const txData = await withTimeout(
      this.escrowContract.transactions(onChainTxId),
      2500,
      "Escrow contract transactions query timed out"
    );

    if (txData.buyer === ethers.ZeroAddress) throw Object.assign(new Error("Unknown on-chain escrow"), {status:404});
    const statusMap = ["Created", "Delivered", "Completed", "Disputed", "Refunded"];

    return {
      on_chain_tx_id: onChainTxId.toString(),
      buyer: txData.buyer,
      seller: txData.seller,
      amount: ethers.formatEther(txData.amount),
      status: statusMap[Number(txData.status)] || "Unknown",
      created_at: new Date(Number(txData.createdAt) * 1000).toISOString(),
      updated_at: new Date(Number(txData.updatedAt) * 1000).toISOString(),
    };
  }
}

// Singleton instance
const contractService = new ContractService();

module.exports = contractService;
