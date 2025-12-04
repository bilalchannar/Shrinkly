const router = require("express").Router();
const {
  createShortLink,
  getAllLinks,
  getLinkById,
  updateLink,
  deleteLink,
  bulkDeleteLinks,
  bulkUpdateStatus,
  redirectToOriginal,
  getLinkStats,
  exportLinks
} = require("../controllers/linkController");

// Link CRUD operations
router.post("/shorten", createShortLink);
router.get("/links", getAllLinks);
router.get("/links/stats", getLinkStats);
router.get("/links/export", exportLinks);
router.get("/links/:id", getLinkById);
router.put("/links/:id", updateLink);
router.delete("/links/:id", deleteLink);

// Bulk operations
router.post("/links/bulk-delete", bulkDeleteLinks);
router.post("/links/bulk-status", bulkUpdateStatus);

// Redirect route (should be last to avoid conflicts)
router.get("/:code", redirectToOriginal);

module.exports = router;
