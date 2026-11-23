// ============================================================
//  controllers/authController.js — Wallet-based Authentication
// ============================================================

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const { User } = require("../models");
const { JWT_SECRET } = require("../middleware/auth");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generates a challenge nonce for a wallet address to sign.
 * POST /api/auth/nonce
 */
const getNonce = async (req, res, next) => {
  try {
    const { wallet_address } = req.body;
    const normalizedWallet = wallet_address.toLowerCase();

    // Generate a secure random nonce
    const nonce = crypto.randomBytes(16).toString("hex");

    // Find or create user record
    const [user] = await User.findOrCreate({
      where: { wallet_address: normalizedWallet },
      defaults: {
        wallet_address: normalizedWallet,
        nonce,
      },
    });

    // Preserve an outstanding challenge so third parties cannot invalidate it.
    if (user.nonce && Date.now() - new Date(user.updated_at).getTime() < 300000) {
      return res.json({success:true, nonce:user.nonce, message:`Sign this message to authenticate with TrustChain: ${user.nonce}`});
    }
    user.nonce = nonce;
    await user.save();

    const message = `Sign this message to authenticate with TrustChain: ${nonce}`;

    return res.status(200).json({
      success: true,
      wallet_address: normalizedWallet,
      nonce,
      message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies MetaMask cryptographic signature and issues a JWT token.
 * POST /api/auth/verify
 */
const verifySignature = async (req, res, next) => {
  try {
    const { wallet_address, signature } = req.body;
    const normalizedWallet = wallet_address.toLowerCase();

    // Look up user
    const user = await User.findByPk(normalizedWallet);
    if (!user || !user.nonce || Date.now() - new Date(user.updated_at).getTime() > 300000) {
      return res.status(400).json({
        success: false,
        message: "No challenge nonce found for this wallet. Request a nonce first at /api/auth/nonce.",
      });
    }

    // Reconstruct the message that was signed
    const message = `Sign this message to authenticate with TrustChain: ${user.nonce}`;

    // Recover address using ethers.verifyMessage
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (sigErr) {
      return res.status(400).json({
        success: false,
        message: "Invalid cryptographic signature format.",
        error: sigErr.message,
      });
    }

    if (recoveredAddress.toLowerCase() !== normalizedWallet) {
      return res.status(401).json({
        success: false,
        message: "Signature verification failed. The signer does not match the claimed wallet address.",
      });
    }

    // Invalidate nonce to prevent replay attacks
    const [consumed] = await User.update({nonce:null}, {where:{wallet_address:normalizedWallet, nonce:user.nonce}});
    if (!consumed) return res.status(409).json({message:"Challenge already consumed"});

    // Issue JWT
    const token = jwt.sign(
      {
        wallet_address: user.wallet_address,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        bio: user.bio,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNonce,
  verifySignature,
};
