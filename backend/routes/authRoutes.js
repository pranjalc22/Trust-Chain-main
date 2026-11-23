// ============================================================
//  routes/authRoutes.js — Authentication Endpoints
// ============================================================

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { nonceValidation, verifyValidation } = require("../validators/authValidator");
const validate = require("../middleware/validate");

// POST /api/auth/nonce — Generate a challenge nonce for wallet to sign
router.post("/nonce", nonceValidation, validate, authController.getNonce);

// POST /api/auth/verify — Verify signature and return JWT
router.post("/verify", verifyValidation, validate, authController.verifySignature);

module.exports = router;
