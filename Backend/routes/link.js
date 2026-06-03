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
  exportLinks,
  checkLinkPassword
} = require("../controllers/linkController");

// Link CRUD (require auth)
router.post("/shorten",              optionalAuth, createShortLink);
router.get("/links",                 auth, getAllLinks);
router.get("/links/stats",           auth, getLinkStats);
router.get("/links/export",          auth, exportLinks);
router.get("/links/:id",             auth, getLinkById);
router.put("/links/:id",             auth, updateLink);
router.delete("/links/:id",          auth, deleteLink);

// Bulk operations (require auth)
router.post("/links/bulk-delete",    auth, bulkDeleteLinks);
router.post("/links/bulk-status",    auth, bulkUpdateStatus);

// Password check for protected links (no auth needed — public)
router.post("/links/check-password/:code", checkLinkPassword);

module.exports = router;
