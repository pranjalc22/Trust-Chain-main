// ============================================================
//  validators/authValidator.js — Auth Input Validation Rules
// ============================================================

const { body } = require("express-validator");

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const nonceValidation = [
  body("wallet_address")
    .trim()
    .notEmpty()
    .withMessage("wallet_address is required")
    .matches(ethAddressRegex)
    .withMessage("wallet_address must be a valid 42-character Ethereum address (0x...)"),
];

const verifyValidation = [
  body("wallet_address")
    .trim()
    .notEmpty()
    .withMessage("wallet_address is required")
    .matches(ethAddressRegex)
    .withMessage("wallet_address must be a valid 42-character Ethereum address (0x...)"),
  body("signature")
    .trim()
    .notEmpty()
    .withMessage("signature is required")
    .matches(/^0x[a-fA-F0-9]+$/)
    .withMessage("signature must be a valid hex string starting with 0x"),
];

module.exports = {
  nonceValidation,
  verifyValidation,
};
