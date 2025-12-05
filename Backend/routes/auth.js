const express = require("express");
const router = express.Router();
const { signup, login, getCurrentUser } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", auth, getCurrentUser);

module.exports = router;
