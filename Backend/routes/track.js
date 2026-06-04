const express = require("express");
const router = express.Router();
const { linkPasswordLimiter } = require("../utils/rateLimiters");
const {
  trackConversion,
  trackPixel
} = require("../controllers/conversionTracker");

// Public endpoints (no authentication required, but rate limited)

// Track conversion via API (server-to-server)
router.post("/conversion", linkPasswordLimiter, trackConversion);

// Track conversion via pixel (image tag)
router.get("/pixel/:pixelId", trackPixel);

module.exports = router;
