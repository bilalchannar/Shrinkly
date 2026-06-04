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
  bulkDeleteQRCodes,
  recordQRScan
} = require("../controllers/qrController");

// Public QR Scan tracking routes (no authentication required)
router.get("/:id/scan", recordQRScan);
router.post("/:id/scan", recordQRScan);

// All subsequent routes require authentication
router.use(auth);

// QR Code CRUD routes
router.post("/", createQRCode);
router.get("/", getAllQRCodes);
router.get("/stats", getQRCodeStats);
router.get("/:id", getQRCodeById);
router.patch("/:id", updateQRCode);
router.put("/:id", updateQRCode);
router.delete("/:id", deleteQRCode);

// Track download
router.post("/:id/download", trackDownload);

// Bulk operations
router.post("/bulk-delete", bulkDeleteQRCodes);

module.exports = router;
