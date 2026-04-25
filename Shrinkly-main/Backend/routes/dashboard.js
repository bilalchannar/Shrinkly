const router = require("express").Router();
const { auth, optionalAuth } = require("../middleware/auth");
const {
  getPublicStats,
  getUserDashboard
} = require("../controllers/dashboardController");

// Public stats (no auth required)
router.get("/public", getPublicStats);

// User dashboard (auth required)
router.get("/", auth, getUserDashboard);

module.exports = router;
