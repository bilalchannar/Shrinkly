const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  updateEmail,
  changePassword,
  deleteAccount,
  getDashboardStats
} = require("../controllers/profileController");

// All routes require authentication
router.use(auth);

// Profile routes
router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/email", updateEmail);
router.put("/password", changePassword);
router.delete("/", deleteAccount);

// Dashboard stats
router.get("/dashboard", getDashboardStats);

module.exports = router;
