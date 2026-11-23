// ============================================================
//  controllers/ratingController.js — Ratings & Reviews
// ============================================================

const { Rating, Transaction, User } = require("../models");

/**
 * Submits a rating for a counterparty in a transaction.
 * CRITICAL RULE: Validates that the transaction status is 'Completed' first.
 * POST /api/ratings
 */
const submitRating = async (req, res, next) => {
  try {
    const { transaction_id, to_wallet, stars, comment, from_wallet } = req.body;

    const callerWallet = (req.user?.wallet_address || "").toLowerCase();
    const recipientWallet = to_wallet.toLowerCase();

    if (from_wallet && from_wallet.toLowerCase() !== callerWallet) {
      return res.status(403).json({
        success: false,
        message: "from_wallet must match the authenticated wallet.",
      });
    }

    if (!callerWallet) {
      return res.status(400).json({
        success: false,
        message: "from_wallet is required or user must be authenticated.",
      });
    }

    if (callerWallet === recipientWallet) {
      return res.status(400).json({
        success: false,
        message: "You cannot rate yourself.",
      });
    }

    // 1. Fetch transaction
    const transaction = await Transaction.findByPk(transaction_id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: `Transaction with ID '${transaction_id}' not found.`,
      });
    }

    const chain = await require('../blockchain/verify')(transaction);
    transaction.status = chain.status;
    const service = require('../blockchain/contractService');
    const rated = await service.reputationContract.hasRated(transaction.on_chain_tx_id, callerWallet);
    if (!rated) return res.status(409).json({message:'Submit the rating on-chain first'});
    // 2. Validate transaction status is 'Completed'
    if (transaction.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: `Validation failed: Transaction must be 'Completed' before submitting a rating. Current status is '${transaction.status}'.`,
      });
    }

    // 3. Verify that caller and recipient were actual participants in this transaction
    const isParticipant =
      callerWallet === transaction.buyer_wallet || callerWallet === transaction.seller_wallet;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You can only rate transactions you participated in as buyer or seller.",
      });
    }

    const isCounterparty =
      (callerWallet === transaction.buyer_wallet && recipientWallet === transaction.seller_wallet) ||
      (callerWallet === transaction.seller_wallet && recipientWallet === transaction.buyer_wallet);
    if (!isCounterparty) {
      return res.status(400).json({
        success: false,
        message: "The rated wallet must be your counterparty in this transaction.",
      });
    }

    // 4. Prevent duplicate ratings from same user on same transaction
    const existingRating = await Rating.findOne({
      where: {
        transaction_id,
        from_wallet: callerWallet,
      },
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a rating for this transaction.",
      });
    }

    // Ensure profiles exist
    await User.findOrCreate({ where: { wallet_address: callerWallet }, defaults: { wallet_address: callerWallet } });
    await User.findOrCreate({ where: { wallet_address: recipientWallet }, defaults: { wallet_address: recipientWallet } });

    // 5. Create rating
    const rating = await Rating.create({
      transaction_id,
      from_wallet: callerWallet,
      to_wallet: recipientWallet,
      stars: parseInt(stars, 10),
      comment: comment || null,
    });

    return res.status(201).json({
      success: true,
      message: "Rating submitted successfully.",
      rating,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists all ratings received by a specific wallet address.
 * GET /api/ratings/user/:wallet
 */
const getUserRatings = async (req, res, next) => {
  try {
    const wallet = req.params.wallet.toLowerCase();

    const ratings = await Rating.findAll({
      where: { to_wallet: wallet },
      include: [
        { model: User, as: "author", attributes: ["wallet_address", "display_name"] },
        { model: Transaction, as: "transaction", attributes: ["id", "amount", "currency", "description"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: ratings.length,
      ratings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRating,
  getUserRatings,
};
