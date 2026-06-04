const router = require("express").Router();
const { auth, optionalAuth } = require("../middleware/auth");
const { isAdmin } = require("../middleware/authorize");
const { contactLimiter } = require("../utils/rateLimiters");
const {
  submitContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
  bulkUpdateContacts,
  bulkDeleteContacts
} = require("../controllers/contactController");

// Public route - submit contact form
router.post("/", optionalAuth, contactLimiter, submitContact);

// Authenticated route - get user's own contacts
router.get("/", auth, getAllContacts);

// Admin routes (require authentication + admin role)
router.get("/stats", auth, isAdmin, getContactStats);
router.get("/:id", auth, getContactById);
router.put("/:id", auth, isAdmin, updateContact);
router.delete("/:id", auth, isAdmin, deleteContact);

// Bulk operations (admin only)
router.post("/bulk-update", auth, isAdmin, bulkUpdateContacts);
router.post("/bulk-delete", auth, isAdmin, bulkDeleteContacts);

module.exports = router;
