const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendVerificationValidation
} = require("../middleware/validate");
const {
  loginLimiter,
  signupLimiter,
  emailLimiter,
  passwordResetLimiter
} = require("../utils/rateLimiters");

// Auth routes
router.post("/signup",   signupLimiter,  signupValidation,              signup);
router.post("/login",    loginLimiter,   loginValidation,               login);
router.get("/me",        auth,                                           getCurrentUser);

// Token management
router.post("/refresh-token",           refreshToken);
router.post("/logout",       auth,      logout);

// Email verification routes
router.get("/verify-email",        verifyEmail);
router.post("/resend-verification", emailLimiter, resendVerificationValidation, resendVerification);

// Password reset routes
router.post("/forgot-password", emailLimiter, forgotPasswordValidation, forgotPassword);
router.post("/reset-password",  passwordResetLimiter, resetPasswordValidation,  resetPassword);

module.exports = router;
