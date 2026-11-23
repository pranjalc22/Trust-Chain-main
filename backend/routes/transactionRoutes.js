// ============================================================
//  routes/transactionRoutes.js — Transaction Endpoints
// ============================================================

const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const {
  createTransactionValidation,
  updateStatusValidation,
} = require("../validators/transactionValidator");
const validate = require("../middleware/validate");
const { authenticateToken } = require("../middleware/auth");

// POST /api/transactions — Create/record a transaction record (called after on-chain escrow creation)
router.post(
  "/",
  authenticateToken,
  createTransactionValidation,
  validate,
  transactionController.createTransaction
);

// GET /api/transactions/user/:wallet — List a user's transactions (buyer or seller)
router.get("/user/:wallet", transactionController.getUserTransactions);

// GET /api/transactions/:id — Get transaction detail
router.get("/:id", transactionController.getTransactionById);

// PATCH /api/transactions/:id/status — Update status (called after on-chain events or manual triggers)
router.patch(
  "/:id/status",
  authenticateToken,
  updateStatusValidation,
  validate,
  transactionController.updateTransactionStatus
);

module.exports = router;
