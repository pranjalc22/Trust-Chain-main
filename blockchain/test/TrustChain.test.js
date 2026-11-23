// ============================================================
//  Escrow & Reputation — Hardhat Test Suite
// ============================================================
//  Covers:
//    1. Successful escrow flow (end-to-end)
//    2. Dispute flow (buyer wins & seller wins)
//    3. Reentrancy protection
//    4. Unauthorized access attempts
//    5. Reputation scoring & ratings
// ============================================================

const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("TrustChain — Escrow & Reputation", function () {
  // Shared variables across all tests
  let escrow, reputation;
  let deployer, arbitrator, buyer, seller, stranger;

  // --------------------------------------------------------
  //  Deploy fresh contracts before every test
  // --------------------------------------------------------
  beforeEach(async function () {
    [deployer, arbitrator, buyer, seller, stranger] = await ethers.getSigners();

    // Deploy Escrow with the arbitrator address
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(arbitrator.address);
    await escrow.waitForDeployment();

    // Deploy Reputation linked to Escrow
    const Reputation = await ethers.getContractFactory("Reputation");
    reputation = await Reputation.deploy(await escrow.getAddress());
    await reputation.waitForDeployment();

    // Link Escrow → Reputation (must be called by arbitrator)
    await escrow.connect(arbitrator).setReputationContract(await reputation.getAddress());
  });

  // ==========================================================
  //  1. SUCCESSFUL ESCROW FLOW (Happy Path)
  // ==========================================================
  describe("Successful Escrow Flow", function () {
    it("should complete a full escrow lifecycle: create → deliver → confirm", async function () {
      const depositAmount = ethers.parseEther("1.0");

      // --- Step 1: Buyer creates a transaction ---
      const tx = await escrow
        .connect(buyer)
        .createTransaction(seller.address, 3, { value: depositAmount });

      await tx.wait();
      const transactionId = 0; // First transaction

      // Verify the TransactionCreated event
      await expect(tx)
        .to.emit(escrow, "TransactionCreated")
        .withArgs(transactionId, buyer.address, seller.address, depositAmount);

      // Verify stored data
      const txnData = await escrow.getTransaction(transactionId);
      expect(txnData.buyer).to.equal(buyer.address);
      expect(txnData.seller).to.equal(seller.address);
      expect(txnData.amount).to.equal(depositAmount);
      expect(txnData.status).to.equal(0); // Status.Created

      // --- Step 2: Seller marks as delivered ---
      const deliverTx = await escrow.connect(seller).markDelivered(transactionId);
      await expect(deliverTx)
        .to.emit(escrow, "Delivered")
        .withArgs(transactionId);

      // --- Step 3: Buyer confirms completion ---
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      const confirmTx = await escrow.connect(buyer).confirmCompletion(transactionId);
      await expect(confirmTx)
        .to.emit(escrow, "Completed")
        .withArgs(transactionId, seller.address, depositAmount);

      // Verify seller received funds
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(depositAmount);

      // Verify transaction status is Completed
      const finalData = await escrow.getTransaction(transactionId);
      expect(finalData.status).to.equal(2); // Status.Completed
    });

    it("should track the completed relationship between buyer and seller", async function () {
      const depositAmount = ethers.parseEther("0.5");

      // Run through the full flow
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(seller).markDelivered(0);
      await escrow.connect(buyer).confirmCompletion(0);

      // Both directions should be true
      expect(await escrow.hasCompletedTransaction(buyer.address, seller.address)).to.equal(true);
      expect(await escrow.hasCompletedTransaction(seller.address, buyer.address)).to.equal(true);
    });

    it("should increment the transaction counter for multiple transactions", async function () {
      const amount = ethers.parseEther("0.1");

      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: amount });
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: amount });
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: amount });

      expect(await escrow.transactionCount()).to.equal(3);
    });
  });

  // ==========================================================
  //  2. DISPUTE FLOW
  // ==========================================================
  describe("Dispute Flow", function () {
    const depositAmount = ethers.parseEther("2.0");

    beforeEach(async function () {
      // Create and deliver a transaction for dispute tests
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(seller).markDelivered(0);
    });

    it("should allow buyer to raise a dispute", async function () {
      const tx = await escrow.connect(buyer).raiseDispute(0);
      await expect(tx)
        .to.emit(escrow, "Disputed")
        .withArgs(0, buyer.address);

      const txnData = await escrow.getTransaction(0);
      expect(txnData.status).to.equal(3); // Status.Disputed
    });

    it("should allow seller to raise a dispute", async function () {
      // Create a new transaction in Created state
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });

      const tx = await escrow.connect(seller).raiseDispute(1);
      await expect(tx)
        .to.emit(escrow, "Disputed")
        .withArgs(1, seller.address);
    });

    it("should resolve dispute in seller's favour — funds go to seller", async function () {
      await escrow.connect(buyer).raiseDispute(0);

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      const tx = await escrow.connect(arbitrator).resolveDispute(0, true);
      await expect(tx)
        .to.emit(escrow, "Resolved")
        .withArgs(0, true);

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(depositAmount);

      const txnData = await escrow.getTransaction(0);
      expect(txnData.status).to.equal(2); // Status.Completed
    });

    it("should resolve dispute in buyer's favour — funds go back to buyer", async function () {
      await escrow.connect(buyer).raiseDispute(0);

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await escrow.connect(arbitrator).resolveDispute(0, false);
      await expect(tx)
        .to.emit(escrow, "Resolved")
        .withArgs(0, false);

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      // Buyer balance should increase (gas costs are minimal relative to 2 ETH)
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);

      const txnData = await escrow.getTransaction(0);
      expect(txnData.status).to.equal(4); // Status.Refunded
    });
  });

  // ==========================================================
  //  3. REENTRANCY PROTECTION
  // ==========================================================
  describe("Reentrancy Protection", function () {
    it("should prevent reentrancy on confirmCompletion", async function () {
      // Deploy a malicious contract that tries to re-enter
      const AttackerFactory = await ethers.getContractFactory("ReentrancyAttacker");
      const attacker = await AttackerFactory.deploy(await escrow.getAddress());
      await attacker.waitForDeployment();
      const attackerAddress = await attacker.getAddress();

      const escrowAddress = await escrow.getAddress();
      const depositAmount = ethers.parseEther("1.0");

      // Fund the attacker contract so it can create an escrow
      await deployer.sendTransaction({
        to: attackerAddress,
        value: ethers.parseEther("5.0"),
      });

      // Attacker creates TWO escrow transactions (to try draining both in one call)
      await attacker.createEscrow(seller.address, { value: depositAmount });
      await attacker.createEscrow(seller.address, { value: depositAmount });

      // Seller marks both as delivered
      await escrow.connect(seller).markDelivered(0);
      await escrow.connect(seller).markDelivered(1);

      // Record the escrow contract balance before the attack
      const escrowBalanceBefore = await ethers.provider.getBalance(escrowAddress);
      expect(escrowBalanceBefore).to.equal(depositAmount * 2n); // 2 ETH locked

      // The attack call won't revert — the first confirmCompletion succeeds,
      // but the re-entrant call inside receive() is blocked by ReentrancyGuard.
      // So only 1 ETH is released, not both.
      await attacker.attack(0);

      // Verify: escrow still holds 1 ETH (the 2nd transaction is untouched)
      const escrowBalanceAfter = await ethers.provider.getBalance(escrowAddress);
      expect(escrowBalanceAfter).to.equal(depositAmount); // Only 1 ETH released

      // The first transaction should be completed
      const txn0 = await escrow.getTransaction(0);
      expect(txn0.status).to.equal(2); // Completed

      // The second transaction should still be in Delivered state (not drained)
      const txn1 = await escrow.getTransaction(1);
      expect(txn1.status).to.equal(1); // Still Delivered
    });
  });

  // ==========================================================
  //  4. UNAUTHORIZED ACCESS ATTEMPTS
  // ==========================================================
  describe("Unauthorized Access", function () {
    const depositAmount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
    });

    it("should reject non-seller calling markDelivered", async function () {
      await expect(
        escrow.connect(buyer).markDelivered(0)
      ).to.be.revertedWith("Escrow: only seller can mark delivered");
    });

    it("should reject non-buyer calling confirmCompletion", async function () {
      await escrow.connect(seller).markDelivered(0);

      await expect(
        escrow.connect(seller).confirmCompletion(0)
      ).to.be.revertedWith("Escrow: only buyer can confirm");
    });

    it("should reject non-arbitrator calling resolveDispute", async function () {
      await escrow.connect(buyer).raiseDispute(0);

      // Buyer tries to resolve — should fail
      await expect(
        escrow.connect(buyer).resolveDispute(0, true)
      ).to.be.revertedWith("Escrow: caller is not the arbitrator");

      // Seller tries to resolve — should fail
      await expect(
        escrow.connect(seller).resolveDispute(0, false)
      ).to.be.revertedWith("Escrow: caller is not the arbitrator");

      // Random stranger tries — should fail
      await expect(
        escrow.connect(stranger).resolveDispute(0, true)
      ).to.be.revertedWith("Escrow: caller is not the arbitrator");
    });

    it("should reject strangers from raising a dispute", async function () {
      await expect(
        escrow.connect(stranger).raiseDispute(0)
      ).to.be.revertedWith("Escrow: only buyer or seller can dispute");
    });

    it("should reject creating a transaction with zero value", async function () {
      await expect(
        escrow.connect(buyer).createTransaction(seller.address, 3, { value: 0 })
      ).to.be.revertedWith("Escrow: must send ETH");
    });

    it("should reject buyer and seller being the same address", async function () {
      await expect(
        escrow.connect(buyer).createTransaction(buyer.address, 3, { value: depositAmount })
      ).to.be.revertedWith("Escrow: buyer and seller cannot be the same");
    });

    it("should reject setting reputation contract twice", async function () {
      // Already set in beforeEach (at top level), try again
      await expect(
        escrow.connect(arbitrator).setReputationContract(stranger.address)
      ).to.be.revertedWith("Escrow: reputation already set");
    });
  });

  // ==========================================================
  //  5. REPUTATION SYSTEM
  // ==========================================================
  describe("Reputation System", function () {
    const depositAmount = ethers.parseEther("1.0");

    it("should update reputation on successful completion", async function () {
      // Complete a transaction
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(seller).markDelivered(0);
      await escrow.connect(buyer).confirmCompletion(0);

      // Check seller's reputation
      const sellerRep = await reputation.getReputation(seller.address);
      expect(sellerRep.completedTransactions).to.equal(1);
      expect(sellerRep.disputesWon).to.equal(0);  // ordinary completion is not a dispute
      expect(sellerRep.disputesLost).to.equal(0);

      // Check buyer's reputation too
      const buyerRep = await reputation.getReputation(buyer.address);
      expect(buyerRep.completedTransactions).to.equal(1);
    });

    it("should update reputation correctly after a dispute (seller wins)", async function () {
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(buyer).raiseDispute(0);
      await escrow.connect(arbitrator).resolveDispute(0, true); // seller wins

      const sellerRep = await reputation.getReputation(seller.address);
      expect(sellerRep.completedTransactions).to.equal(1);
      expect(sellerRep.disputesWon).to.equal(1);

      const buyerRep = await reputation.getReputation(buyer.address);
      expect(buyerRep.disputesLost).to.equal(1);
    });

    it("should update reputation correctly after a dispute (buyer wins)", async function () {
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(buyer).raiseDispute(0);
      await escrow.connect(arbitrator).resolveDispute(0, false); // buyer wins

      const buyerRep = await reputation.getReputation(buyer.address);
      expect(buyerRep.completedTransactions).to.equal(1);
      expect(buyerRep.disputesWon).to.equal(1);

      const sellerRep = await reputation.getReputation(seller.address);
      expect(sellerRep.disputesLost).to.equal(1);
    });

    it("should allow star rating after a completed transaction", async function () {
      // Complete a transaction first
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(seller).markDelivered(0);
      await escrow.connect(buyer).confirmCompletion(0);

      // Buyer rates the seller
      const tx = await reputation.connect(buyer).submitRating(0, seller.address, 5);
      await expect(tx)
        .to.emit(reputation, "RatingSubmitted")
        .withArgs(buyer.address, seller.address, 5);

      const sellerRep = await reputation.getReputation(seller.address);
      expect(sellerRep.totalRatingSum).to.equal(5);
      expect(sellerRep.ratingCount).to.equal(1);
    });

    it("should reject rating without a completed transaction", async function () {
      await expect(
        reputation.connect(stranger).submitRating(0, seller.address, 4)
      ).to.be.revertedWith("Reputation: no completed transaction with this user");
    });

    it("should reject duplicate ratings", async function () {
      // Complete and rate once
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(seller).markDelivered(0);
      await escrow.connect(buyer).confirmCompletion(0);
      await reputation.connect(buyer).submitRating(0, seller.address, 4);

      // Try rating again
      await expect(
        reputation.connect(buyer).submitRating(0, seller.address, 5)
      ).to.be.revertedWith("Reputation: already rated this user");
    });

    it("should reject self-rating", async function () {
      await expect(
        reputation.connect(buyer).submitRating(0, buyer.address, 5)
      ).to.be.revertedWith("Reputation: cannot rate yourself");
    });

    it("should reject invalid star values", async function () {
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(seller).markDelivered(0);
      await escrow.connect(buyer).confirmCompletion(0);

      await expect(
        reputation.connect(buyer).submitRating(0, seller.address, 0)
      ).to.be.revertedWith("Reputation: stars must be 1-5");

      await expect(
        reputation.connect(buyer).submitRating(0, seller.address, 6)
      ).to.be.revertedWith("Reputation: stars must be 1-5");
    });

    it("should calculate reputation score correctly", async function () {
      // Complete a transaction and rate the seller 4 stars
      await escrow.connect(buyer).createTransaction(seller.address, 3, { value: depositAmount });
      await escrow.connect(seller).markDelivered(0);
      await escrow.connect(buyer).confirmCompletion(0);
      await reputation.connect(buyer).submitRating(0, seller.address, 4);

      // Seller: completedTransactions=1, avgRating=4, disputesLost=0
      // Score = (1 * 10) + (4 * 5) - (0 * 15) = 10 + 20 - 0 = 30
      const score = await reputation.getReputationScore(seller.address);
      expect(score).to.equal(30);
    });

    it("should return 0 for users with no activity", async function () {
      const score = await reputation.getReputationScore(stranger.address);
      expect(score).to.equal(0);
    });

    it("should reject non-Escrow callers from updating reputation", async function () {
      await expect(
        reputation.connect(stranger).updateOnCompletion(buyer.address, true, false)
      ).to.be.revertedWith("Reputation: caller is not the Escrow contract");
    });
  });
});
