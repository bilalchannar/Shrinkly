const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
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

// OAuth Start Routes
router.get("/google", (req, res, next) => {
  const plan = req.query.plan || "free";
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    session: false,
    state: plan
  })(req, res, next);
});

router.get("/github", (req, res, next) => {
  const plan = req.query.plan || "free";
  passport.authenticate("github", { 
    scope: ["user:email"], 
    session: false,
    state: plan
  })(req, res, next);
});

// OAuth Callback Routes
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth?oauthError=Google login failed`, session: false }),
  (req, res) => {
    const plan = req.query.state || "free";
    const accessToken = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/oauth-success?token=${accessToken}&plan=${plan}`);
  }
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth?oauthError=GitHub login failed`, session: false }),
  (req, res) => {
    const plan = req.query.state || "free";
    const accessToken = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/oauth-success?token=${accessToken}&plan=${plan}`);
  }
);

module.exports = router;
