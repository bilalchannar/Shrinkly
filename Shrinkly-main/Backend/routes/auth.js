const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  signup,
  login,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendVerificationValidation
} = require("../middleware/validate");

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many signup attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: "Too many email requests. Please wait an hour before trying again." },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth routes
router.post("/signup",   signupLimiter,  signupValidation,              signup);
router.post("/login",    loginLimiter,   loginValidation,               login);
router.get("/me",        auth,                                           getCurrentUser);

// Email verification routes
router.get("/verify-email",        verifyEmail);
router.post("/resend-verification", emailLimiter, resendVerificationValidation, resendVerification);

// Password reset routes
router.post("/forgot-password", emailLimiter, forgotPasswordValidation, forgotPassword);
router.post("/reset-password",               resetPasswordValidation,  resetPassword);

module.exports = router;
