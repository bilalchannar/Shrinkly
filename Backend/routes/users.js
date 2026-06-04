const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount,
  exportUserData
} = require("../controllers/userController");

// All user settings endpoints require authentication
router.use(auth);

router.get("/profile", getUserProfile);
router.patch("/profile", updateUserProfile);
router.patch("/change-password", changePassword);
router.delete("/account", deleteAccount);
router.get("/export-data", exportUserData);

module.exports = router;
