const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  createQRCode,
  getAllQRCodes,
  getQRCodeById,
  updateQRCode,
  deleteQRCode,
  trackDownload,
  getQRCodeStats,
  bulkDeleteQRCodes
} = require("../controllers/qrCodeController");

// All routes require authentication
router.use(auth);

// QR Code CRUD routes
router.post("/", createQRCode);
router.get("/", getAllQRCodes);
router.get("/stats", getQRCodeStats);
router.get("/:id", getQRCodeById);
router.put("/:id", updateQRCode);
router.delete("/:id", deleteQRCode);

// Track download (can be called without auth too)
router.post("/:id/download", trackDownload);

// Bulk operations
router.post("/bulk-delete", bulkDeleteQRCodes);

module.exports = router;
