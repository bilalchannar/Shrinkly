const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  displayName: { type: String, default: "" },
  bio: { type: String, default: "" },
  phone: { type: String, default: "" },
  company: { type: String, default: "" },
  location: { type: String, default: "" },
  avatar: { type: String, default: null },
  profileImage: { type: String, default: null },
  timezone: { type: String, default: "UTC" },
  defaultDomain: { type: String, default: "shrinkly.link" },
  defaultQrForegroundColor: { type: String, default: "#6f42c1" },
  defaultQrBackgroundColor: { type: String, default: "#ffffff" },
  emailReportsEnabled: { type: Boolean, default: true },
  plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  billingPlan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  
  // Role-Based Access Control
  role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
  
  // Legacy isAdmin field (deprecated but kept for backward compatibility)
  isAdmin: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },

  // OAuth specific fields
  authProvider: { type: String, enum: ["local", "google", "github", "microsoft", "linkedin"], default: "local" },
  providerId: { type: String, default: null },
  providers: [{
    provider: { type: String },
    providerId: { type: String }
  }],

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
userSchema.index({ role: 1 });
userSchema.index({ billingPlan: 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

module.exports = mongoose.model("User", userSchema);

