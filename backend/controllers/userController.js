// ============================================================
//  controllers/userController.js — User Profiles & Reputation
// ============================================================

const { Op } = require("sequelize");
const { User, Transaction, Rating, Dispute } = require("../models");
const contractService = require("../blockchain/contractService");

/**
 * Gets a user's public profile and reputation metrics.
 * GET /api/users/:wallet
 */
const getUserProfile = async (req, res, next) => {
  try {
    const wallet = req.params.wallet.toLowerCase();

    // Find or create profile
    let user = await User.findByPk(wallet);
    if (!user) {
      user = await User.create({
        wallet_address: wallet,
        display_name: `User ${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
      });
    }

    // Query transaction statistics
    const totalTransactions = await Transaction.count({
      where: {
        [Op.or]: [{ buyer_wallet: wallet }, { seller_wallet: wallet }],
      },
    });

    const completedTransactions = await Transaction.count({
      where: {
        [Op.or]: [{ buyer_wallet: wallet }, { seller_wallet: wallet }],
        status: "Completed",
      },
    });

    const disputedTransactions = await Transaction.count({
      where: {
        [Op.or]: [{ buyer_wallet: wallet }, { seller_wallet: wallet }],
        status: "Disputed",
      },
    });

    // Query ratings received
    const ratingsReceived = await Rating.findAll({
      where: { to_wallet: wallet },
      order: [["created_at", "DESC"]],
      limit: 10,
    });

    const totalRatings = await Rating.count({
      where: { to_wallet: wallet },
    });

    let averageRating = 0;
    if (totalRatings > 0) {
      const ratingSum = await Rating.sum("stars", { where: { to_wallet: wallet } });
      averageRating = +(ratingSum / totalRatings).toFixed(2);
    }

    // Query disputes won/lost
    const disputesLost = await Dispute.count({
      where: {
        status: "Resolved_Buyer",
        // If user is seller and dispute resolved to buyer, seller lost
        "$transaction.seller_wallet$": wallet,
      },
      include: [{ model: Transaction, as: "transaction" }],
    });

    const disputesWon = await Dispute.count({
      where: {
        status: "Resolved_Seller",
        "$transaction.seller_wallet$": wallet,
      },
      include: [{ model: Transaction, as: "transaction" }],
    });

    // Off-chain calculated reputation score (0 - 100)
    // Base 50 + 5 per completed deal + 5 per avg star - 15 per lost dispute
    let calculatedScore = 50 + completedTransactions * 5 + averageRating * 5 - disputesLost * 15;
    calculatedScore = Math.max(0, Math.min(100, Math.round(calculatedScore)));

    // Try reading live on-chain reputation if contract is linked
    let onChainData = null;
    try {
      onChainData = await contractService.getOnChainReputation(wallet);
    } catch {
      // Graceful fallback if blockchain service is offline or not deployed
    }

    return res.status(200).json({
      success: true,
      user: {
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        bio: user.bio,
        created_at: user.created_at,
      },
      reputation: {
        calculated_score: calculatedScore,
        completed_transactions: completedTransactions,
        total_transactions: totalTransactions,
        disputed_transactions: disputedTransactions,
        disputes_lost: disputesLost,
        disputes_won: disputesWon,
        total_ratings: totalRatings,
        average_rating: averageRating,
        recent_ratings: ratingsReceived,
        on_chain: onChainData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a user's profile information (display_name, bio).
 * PUT /api/users/:wallet
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const { display_name, bio } = req.body;

    if (req.user && req.user.wallet_address !== wallet) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile.",
      });
    }

    let user = await User.findByPk(wallet);
    if (!user) {
      user = await User.create({ wallet_address: wallet });
    }

    if (display_name !== undefined) user.display_name = display_name;
    if (bio !== undefined) user.bio = bio;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        bio: user.bio,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists all registered users.
 * GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ limit: 50, order: [["created_at", "DESC"]] });
    return res.status(200).json({
      success: true,
      users: users.map(u => ({
        wallet_address: u.wallet_address,
        display_name: u.display_name,
        bio: u.bio,
        created_at: u.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
};
