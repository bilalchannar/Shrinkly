const router = require("express").Router();
const { auth } = require("../middleware/auth");
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
router.post("/", submitContact);

// Admin routes (require authentication)
router.get("/", auth, getAllContacts);
router.get("/stats", auth, getContactStats);
router.get("/:id", auth, getContactById);
router.put("/:id", auth, updateContact);
router.delete("/:id", auth, deleteContact);

// Bulk operations (admin only)
router.post("/bulk-update", auth, bulkUpdateContacts);
router.post("/bulk-delete", auth, bulkDeleteContacts);

module.exports = router;
