const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getReportSettings,
  createReportSettings,
  updateReportSettings,
  sendReportNow,
  getReportLogs
} = require("../controllers/reportController");

router.get("/settings", auth, getReportSettings);
router.post("/settings", auth, createReportSettings);
router.patch("/settings", auth, updateReportSettings);
router.post("/send-now", auth, sendReportNow);
router.get("/logs", auth, getReportLogs);

module.exports = router;
