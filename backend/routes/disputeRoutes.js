// ============================================================
//  routes/disputeRoutes.js — Dispute Endpoints
// ============================================================

const express = require("express");
const router = express.Router();
const disputeController = require("../controllers/disputeController");
const { createDisputeValidation } = require("../validators/disputeValidator");
const validate = require("../middleware/validate");
const { authenticateToken } = require("../middleware/auth");

// GET /api/disputes/open — List open disputes (for arbitrator review)
router.get("/open", disputeController.getOpenDisputes);

// POST /api/disputes — Create a dispute record with evidence
router.post(
  "/",
  authenticateToken,
  createDisputeValidation,
  validate,
  disputeController.createDispute
);

// PATCH /api/disputes/:id/resolve — Arbitrator resolves a dispute
router.patch("/:id/resolve", authenticateToken, disputeController.resolveDispute);

module.exports = router;
