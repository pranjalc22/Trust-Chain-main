// ============================================================
//  controllers/disputeController.js — Dispute Management
// ============================================================

const { Op } = require("sequelize");
const { Dispute, Transaction, User } = require("../models");

/**
 * Creates a dispute record with evidence and flags the transaction as 'Disputed'.
 * POST /api/disputes
 */
const createDispute = async (req, res, next) => {
  try {
    const { transaction_id, evidence_buyer, evidence_seller, raised_by } = req.body;

    const callerWallet = (req.user?.wallet_address || "").toLowerCase();

    if (raised_by && raised_by.toLowerCase() !== callerWallet) {
      return res.status(403).json({
        success: false,
        message: "raised_by must match the authenticated wallet.",
      });
    }

    // Verify transaction exists
    const transaction = await Transaction.findByPk(transaction_id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: `Transaction with ID '${transaction_id}' not found.`,
      });
    }

    if (![transaction.buyer_wallet, transaction.seller_wallet].includes(callerWallet)) return res.status(403).json({message: "Only participants may submit evidence"});
    if ((callerWallet === transaction.buyer_wallet && evidence_seller) || (callerWallet === transaction.seller_wallet && evidence_buyer)) return res.status(403).json({message: "You may only edit your own evidence"});
    const chain = await require("../blockchain/verify")(transaction);
    if (chain.status !== 'Disputed') return res.status(409).json({message: "Escrow must be disputed on-chain first"});
    if (transaction.status === "Completed" || transaction.status === "Refunded") {
      return res.status(400).json({
        success: false,
        message: `Cannot raise a dispute on a transaction that is already '${transaction.status}'.`,
      });
    }

    // Check if a dispute already exists for this transaction
    let dispute = await Dispute.findOne({ where: { transaction_id } });

    if (dispute) {
      // Append evidence if provided by the other party
      if (evidence_buyer) dispute.evidence_buyer = evidence_buyer;
      if (evidence_seller) dispute.evidence_seller = evidence_seller;
      dispute.updated_at = new Date();
      await dispute.save();

      return res.status(200).json({
        success: true,
        message: "Dispute evidence updated.",
        dispute,
      });
    }

    // Create new dispute record
    dispute = await Dispute.create({
      transaction_id,
      raised_by: callerWallet || transaction.buyer_wallet,
      evidence_buyer: evidence_buyer || null,
      evidence_seller: evidence_seller || null,
      status: "Open",
    });

    // Update transaction status to 'Disputed'
    transaction.status = "Disputed";
    transaction.updated_at = new Date();
    await transaction.save();

    return res.status(201).json({
      success: true,
      message: "Dispute initiated successfully.",
      dispute,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists all open or under review disputes for arbitrators.
 * GET /api/disputes/open
 */
const getOpenDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.findAll({
      where: {
        status: {
          [Op.in]: ["Open", "Under Review"],
        },
      },
      include: [
        {
          model: Transaction,
          as: "transaction",
          include: [
            { model: User, as: "buyer", attributes: ["wallet_address", "display_name"] },
            { model: User, as: "seller", attributes: ["wallet_address", "display_name"] },
          ],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolves a dispute (for arbitrator actions).
 * PATCH /api/disputes/:id/resolve
 */
const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, outcome, resolved_by } = req.body;
    // outcome: "Resolved_Buyer" (refund) or "Resolved_Seller" (payout)

    const dispute = await Dispute.findByPk(id, {
      include: [{ model: Transaction, as: "transaction" }],
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: `Dispute with ID '${id}' not found.`,
      });
    }

    const arbitratorWallet = (req.user?.wallet_address || "").toLowerCase();

    if (resolved_by && resolved_by.toLowerCase() !== arbitratorWallet) {
      return res.status(403).json({
        success: false,
        message: "resolved_by must match the authenticated wallet.",
      });
    }

    // The on-chain contract is the final authority on who may arbitrate. When an
    // arbitrator address is configured off-chain, enforce it for the indexed record too.
    const configuredArbitrator = process.env.ARBITRATOR_WALLET?.toLowerCase();
    if (configuredArbitrator && arbitratorWallet !== configuredArbitrator) {
      return res.status(403).json({
        success: false,
        message: "Only the configured arbitrator may resolve a dispute.",
      });
    }

    if (!['Resolved_Seller', 'Resolved_Buyer'].includes(outcome)) return res.status(400).json({message: 'Invalid outcome'});
    const service = require('../blockchain/contractService');
    if (!service.escrowContract) await service.initialize();
    const arbitrator = await service.escrowContract.arbitrator();
    if (arbitrator.toLowerCase() !== arbitratorWallet) return res.status(403).json({message: 'Only the contract arbitrator may record a verdict'});
    const chain = await require('../blockchain/verify')(dispute.transaction);
    if (chain.status !== (outcome === 'Resolved_Seller' ? 'Completed' : 'Refunded')) return res.status(409).json({message: 'Verdict does not match the contract'});
    dispute.status = outcome === "Resolved_Seller" ? "Resolved_Seller" : "Resolved_Buyer";
    dispute.resolved_by = arbitratorWallet;
    dispute.resolution = resolution || `Arbitrator resolved in favour of ${dispute.status}`;
    dispute.updated_at = new Date();
    await dispute.save();

    // Update parent transaction
    if (dispute.transaction) {
      dispute.transaction.status = outcome === "Resolved_Seller" ? "Completed" : "Refunded";
      dispute.transaction.updated_at = new Date();
      await dispute.transaction.save();
    }

    return res.status(200).json({
      success: true,
      message: "Dispute resolved successfully.",
      dispute,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDispute,
  getOpenDisputes,
  resolveDispute,
};
