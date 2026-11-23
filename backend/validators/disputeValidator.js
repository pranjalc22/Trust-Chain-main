// ============================================================
//  validators/disputeValidator.js — Dispute Validation Rules
// ============================================================

const { body } = require("express-validator");

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const createDisputeValidation = [
  body("transaction_id")
    .trim()
    .notEmpty()
    .withMessage("transaction_id is required"),
  body("raised_by")
    .optional()
    .trim()
    .matches(ethAddressRegex)
    .withMessage("raised_by must be a valid Ethereum address (0x...)"),
  body("evidence_buyer")
    .optional()
    .trim(),
  body("evidence_seller")
    .optional()
    .trim(),
  body().custom((val) => {
    if (!val.evidence_buyer && !val.evidence_seller) {
      throw new Error("At least one piece of evidence (evidence_buyer or evidence_seller) must be provided");
    }
    return true;
  }),
];

module.exports = {
  createDisputeValidation,
};
