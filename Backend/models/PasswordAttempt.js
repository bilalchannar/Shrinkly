const mongoose = require("mongoose");

// Track failed password attempts on password-protected links
const passwordAttemptSchema = new mongoose.Schema(
  {
    linkCode: { type: String, required: true }, // Short code of the link
    ipAddress: { type: String, required: true },
    attempts: { type: Number, default: 1 },
    isLocked: { type: Boolean, default: false },
    lockExpiresAt: { type: Date, default: null }, // When the lock expires
    lastAttemptAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index to find attempts by link code and IP
passwordAttemptSchema.index({ linkCode: 1, ipAddress: 1 }, { unique: true });
passwordAttemptSchema.index({ lockExpiresAt: 1 }); // For cleanup

// Auto-delete old records (after 24 hours)
passwordAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("PasswordAttempt", passwordAttemptSchema);
