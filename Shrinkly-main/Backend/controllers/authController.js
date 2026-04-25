const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { verificationEmailTemplate, passwordResetEmailTemplate } = require("../utils/emailTemplates");

// Helper: generate a safe random hex token
const generateToken = () => crypto.randomBytes(32).toString("hex");

// Helper: build safe user object (no password, no tokens)
const safeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  displayName: user.displayName || user.username,
  bio: user.bio,
  phone: user.phone,
  company: user.company,
  location: user.location,
  avatar: user.avatar,
  plan: user.plan,
  isAdmin: user.isAdmin,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt
});

// ======================== SIGNUP ========================
exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email)
        return res.status(400).json({ message: "Email already registered" });
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token (expires in 24 hours)
    const verificationToken = generateToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName: username,
      verificationToken,
      verificationTokenExpiry
    });
    await user.save();

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    try {
      await sendEmail(
        email,
        "Verify your Shrinkly account",
        verificationEmailTemplate(username, verificationUrl)
      );
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr.message);
      // Don't block signup if email fails — account is created, just not verified
    }

    res.status(201).json({
      message: "Signup successful! Please check your email to verify your account.",
      requiresVerification: true
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== VERIFY EMAIL ========================
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required" });
  }

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token. Please request a new one."
      });
    }

    // Mark email as verified and clear token
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== RESEND VERIFICATION ========================
exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists — security
      return res.json({ message: "If that email is registered, a verification link has been sent." });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Generate new token
    const verificationToken = generateToken();
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    await sendEmail(
      email,
      "Verify your Shrinkly account",
      verificationEmailTemplate(user.username, verificationUrl)
    );

    res.json({ message: "If that email is registered, a verification link has been sent." });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== LOGIN ========================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Block login if email not verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        requiresVerification: true,
        email: user.email
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      user: safeUser(user),
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== GET CURRENT USER ========================
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: safeUser(user) });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== FORGOT PASSWORD ========================
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    // Always respond the same way — security best practice
    if (!user) {
      return res.json({ message: "If that email is registered, a password reset link has been sent." });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = generateToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendEmail(
      email,
      "Reset your Shrinkly password",
      passwordResetEmailTemplate(user.username, resetUrl)
    );

    res.json({ message: "If that email is registered, a password reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== RESET PASSWORD ========================
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token. Please request a new password reset."
      });
    }

    // Hash and save new password, clear token
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully! You can now log in with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
