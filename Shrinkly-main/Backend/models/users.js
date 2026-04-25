const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, default: "" },
  bio: { type: String, default: "" },
  phone: { type: String, default: "" },
  company: { type: String, default: "" },
  location: { type: String, default: "" },
  avatar: { type: String, default: null },
  plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  isAdmin: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },

  // Email verification
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpiry: { type: Date, default: null },

  // Password reset
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpiry: { type: Date, default: null },

  // Notification settings
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

module.exports = mongoose.model("User", userSchema);

