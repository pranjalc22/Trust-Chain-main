// ============================================================
//  middleware/auth.js — Wallet-Based JWT Auth Middleware
// ============================================================

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 24 || JWT_SECRET.startsWith("replace-with")) throw new Error("Set JWT_SECRET to a random secret of at least 24 characters");

/**
 * Enforces JWT authentication.
 * Verifies Bearer token in Authorization header and attaches req.user.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Bearer token required in Authorization header.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      wallet_address: decoded.wallet_address ? decoded.wallet_address.toLowerCase() : null,
    };
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
      error: err.message,
    });
  }
};

/**
 * Optional authentication: attaches req.user if a valid token is provided,
 * but does not reject the request if no token exists.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      wallet_address: decoded.wallet_address ? decoded.wallet_address.toLowerCase() : null,
    };
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET,
};
