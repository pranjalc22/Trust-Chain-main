// ============================================================
//  validators/ratingValidator.js — Rating Validation Rules
// ============================================================

const { body } = require("express-validator");

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const createRatingValidation = [
  body("transaction_id")
    .trim()
    .notEmpty()
    .withMessage("transaction_id is required"),
  body("to_wallet")
    .trim()
    .notEmpty()
    .withMessage("to_wallet is required")
    .matches(ethAddressRegex)
    .withMessage("to_wallet must be a valid Ethereum address (0x...)"),
  body("from_wallet")
    .optional()
    .trim()
    .matches(ethAddressRegex)
    .withMessage("from_wallet must be a valid Ethereum address (0x...)"),
  body("stars")
    .notEmpty()
    .withMessage("stars is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("stars must be an integer between 1 and 5"),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("comment cannot exceed 1000 characters"),
];

module.exports = {
  createRatingValidation,
};
