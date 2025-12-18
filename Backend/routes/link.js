const router = require("express").Router();
const { auth, optionalAuth } = require("../middleware/auth");
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

// Link CRUD operations (require auth)
router.post("/shorten", auth, createShortLink);
router.get("/links", auth, getAllLinks);
router.get("/links/stats", auth, getLinkStats);
router.get("/links/export", auth, exportLinks);
router.get("/links/:id", auth, getLinkById);
router.put("/links/:id", auth, updateLink);
router.delete("/links/:id", auth, deleteLink);

// Bulk operations (require auth)
router.post("/links/bulk-delete", auth, bulkDeleteLinks);
router.post("/links/bulk-status", auth, bulkUpdateStatus);

// Redirect route (should be last to avoid conflicts) - no auth needed
router.get("/:code", redirectToOriginal);

module.exports = router;
