// ============================================================
//  validators/transactionValidator.js — Transaction Validation
// ============================================================

const { body, param } = require("express-validator");

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const validStatuses = [
  "Created",
  "In Progress",
  "Delivered",
  "Completed",
  "Disputed",
  "Refunded",
  "Cancelled",
];

const createTransactionValidation = [
  body("seller_wallet")
    .trim()
    .notEmpty()
    .withMessage("seller_wallet is required")
    .matches(ethAddressRegex)
    .withMessage("seller_wallet must be a valid Ethereum address (0x...)"),
  body("buyer_wallet")
    .optional()
    .trim()
    .matches(ethAddressRegex)
    .withMessage("buyer_wallet must be a valid Ethereum address if provided"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("description is required and cannot be empty")
    .isLength({ max: 1000 })
    .withMessage("description cannot exceed 1000 characters"),
  body("amount")
    .notEmpty()
    .withMessage("amount is required")
    .custom((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("amount must be a positive number");
      }
      return true;
    }),
  body("currency")
    .optional()
    .trim()
    .isLength({ min: 1, max: 16 })
    .withMessage("currency must be between 1 and 16 characters"),
  body("on_chain_tx_id")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("on_chain_tx_id cannot be empty if provided"),
];

const updateStatusValidation = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Transaction ID parameter is required"),
  body("status")
    .trim()
    .notEmpty()
    .withMessage("status is required")
    .isIn(validStatuses)
    .withMessage(`status must be one of: ${validStatuses.join(", ")}`),
  body("on_chain_tx_id")
    .optional()
    .trim(),
];

module.exports = {
  createTransactionValidation,
  updateStatusValidation,
};
