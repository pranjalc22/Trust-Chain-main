// ============================================================
//  routes/ratingRoutes.js — Rating Endpoints
// ============================================================

const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const { createRatingValidation } = require("../validators/ratingValidator");
const validate = require("../middleware/validate");
const { authenticateToken } = require("../middleware/auth");

// POST /api/ratings — Submit a rating (validates transaction is 'Completed' first)
router.post(
  "/",
  authenticateToken,
  createRatingValidation,
  validate,
  ratingController.submitRating
);

// GET /api/ratings/user/:wallet — List ratings for a specific wallet
router.get("/user/:wallet", ratingController.getUserRatings);

module.exports = router;
