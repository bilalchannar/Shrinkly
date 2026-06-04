const mongoose = require("mongoose");

// Blacklist for invalidated JWT tokens (for logout functionality)
const tokenBlacklistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    tokenType: { type: String, enum: ["access", "refresh"], default: "access" },
    expiresAt: { type: Date, required: true }, // Token expiry time
    reason: { type: String, enum: ["logout", "password_reset", "admin_action"], default: "logout" }
  },
  { timestamps: true }
);

// Index to find tokens by user
tokenBlacklistSchema.index({ userId: 1 });
tokenBlacklistSchema.index({ token: 1 });

// Auto-delete expired tokens (using MongoDB TTL)
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
