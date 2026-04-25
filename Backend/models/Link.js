const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    customSlug: { type: String, default: null },
    domain: { type: String, default: "shrinkly.link" },
    clicks: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive", "expired"], default: "active" },
    tags: [{ type: String }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Link expiry — auto-deactivate after this date
    expiresAt: { type: Date, default: null },

    // Click limit — auto-deactivate after N clicks
    maxClicks: { type: Number, default: null },

    // Password protection — null means no password required
    password: { type: String, default: null }
  },
  { timestamps: true }
);

// Index for faster lookups
linkSchema.index({ shortCode: 1 });
linkSchema.index({ userId: 1, createdAt: -1 });
linkSchema.index({ expiresAt: 1 }); // For expiry cleanup jobs

module.exports = mongoose.model("Link", linkSchema);


