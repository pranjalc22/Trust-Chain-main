// ============================================================
//  routes/demoRoutes.js — Demo Management Endpoint
// ============================================================

const express = require("express");
const router = express.Router();


// POST /api/demo/reset — Reset database to clean demo state
// Database-only resets cannot safely reset funded escrows.
router.post("/reset", (req, res) => res.status(410).json({ success: false, message: "Reset disabled. Use a fresh local chain, redeploy, and use a fresh database." }));

module.exports = router;
