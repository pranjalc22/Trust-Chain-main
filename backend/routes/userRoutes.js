// ============================================================
//  routes/userRoutes.js — User Profiles & Reputation Routes
// ============================================================

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

// GET /api/users — List registered users
router.get("/", userController.getAllUsers);

// GET /api/users/:wallet — Get public profile + reputation info
router.get("/:wallet", userController.getUserProfile);

// PUT /api/users/:wallet — Update user profile (bio, display_name)
router.put("/:wallet", authenticateToken, userController.updateUserProfile);

module.exports = router;
