const router = require("express").Router();
const {
  getLinkAnalytics,
  getOverallAnalytics,
  getHeatmapData,
  getInsights,
  exportAnalytics
} = require("../controllers/analyticsController");

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

module.exports = router;
