// ============================================================
//  routes/reputationRoutes.js — Live On-Chain Reputation Route
// ============================================================

const express = require("express");
const router = express.Router();
const reputationController = require("../controllers/reputationController");

// GET /api/reputation/:wallet — Read directly from the smart contract
router.get("/:wallet", reputationController.getLiveReputation);

module.exports = router;
