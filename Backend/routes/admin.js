const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { isAdmin, isSuperAdmin } = require("../middleware/authorize");

const {
  getAdminDashboard,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  suspendUser,
  activateUser,
  getPlatformAnalytics,
  deleteUser,
  getAllLinks,
  disableLink,
  enableLink,
  getTickets,
  updateTicketStatus,
  getReportLogs,
  getAbuseReports,
  updateAbuseReportStatus,
  updateLinkSafety
} = require("../controllers/adminController");

// All admin routes require authentication and admin role verification
router.use(auth, isAdmin);

// ======================== DASHBOARD SUMMARY ========================
router.get("/dashboard", getAdminDashboard);

// ======================== USER MANAGEMENT ========================
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId/role", isSuperAdmin, updateUserRole);
router.patch("/users/:userId/role", isSuperAdmin, updateUserRole);

router.patch("/users/:userId/suspend", suspendUser);
router.put("/users/:userId/suspend", suspendUser); // Legacy support
router.patch("/users/:userId/activate", activateUser);

router.delete("/users/:userId", isSuperAdmin, deleteUser);

// ======================== LINK MANAGEMENT ========================
router.get("/links", getAllLinks);
router.patch("/links/:id/disable", disableLink);
router.patch("/links/:id/enable", enableLink);

// ======================== SUPPORT TICKETS ========================
router.get("/tickets", getTickets);
router.patch("/tickets/:id/status", updateTicketStatus);

// ======================== REPORTS LOGS ========================
router.get("/reports/logs", getReportLogs);

// ======================== ANALYTICS ========================
router.get("/platform-analytics", getPlatformAnalytics);
router.get("/analytics", getPlatformAnalytics); // Legacy support

// ======================== ABUSE MANAGEMENT ========================
router.get("/abuse-reports", getAbuseReports);
router.patch("/abuse-reports/:id/status", updateAbuseReportStatus);
router.patch("/links/:id/safety", updateLinkSafety);

module.exports = router;
