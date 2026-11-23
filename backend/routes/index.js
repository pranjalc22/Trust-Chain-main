// ============================================================
//  routes/index.js — Main API Router
// ============================================================

const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const transactionRoutes = require("./transactionRoutes");
const disputeRoutes = require("./disputeRoutes");
const ratingRoutes = require("./ratingRoutes");
const reputationRoutes = require("./reputationRoutes");
const demoRoutes = require("./demoRoutes");

// Health check endpoint
router.get("/health", async (req, res) => {
  try { await require("../models").sequelize.authenticate(); } catch { return res.status(503).json({ status: "unavailable" }); }
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "TrustChain Backend",
  });
});

// Mount modules
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);
router.use("/disputes", disputeRoutes);
router.use("/ratings", ratingRoutes);
router.use("/reputation", reputationRoutes);
router.use("/demo", demoRoutes);

module.exports = router;
