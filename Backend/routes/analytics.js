const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  getLinkAnalytics,
  getOverallAnalytics,
  getHeatmapData,
  getInsights,
  exportAnalytics
} = require("../controllers/analyticsController");
const {
  createConversionPixel,
  getConversionPixels,
  deleteConversionPixel,
  getConversionAnalytics
} = require("../controllers/conversionTracker");

// All analytics routes require authentication
router.use(auth);

// Get overall analytics (all links)
router.get("/", getOverallAnalytics);

// Get analytics for a specific link
router.get("/link/:linkId", getLinkAnalytics);

// Get heatmap data
router.get("/heatmap", getHeatmapData);

// Get AI insights
router.get("/insights", getInsights);

// Export analytics data
router.get("/export", exportAnalytics);

// ======================== CONVERSION TRACKING ========================
// Create conversion pixel for link
router.post("/link/:linkId/conversion-pixels", createConversionPixel);

// Get all conversion pixels for link
router.get("/link/:linkId/conversion-pixels", getConversionPixels);

// Delete conversion pixel
router.delete("/link/:linkId/conversion-pixels/:pixelId", deleteConversionPixel);

// Get conversion analytics for link
router.get("/link/:linkId/conversions", getConversionAnalytics);

module.exports = router;
