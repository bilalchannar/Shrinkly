const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true },
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
    password: { type: String, default: null },
    
    // UTM campaign parameters
    utmParams: {
      utm_source: { type: String, default: null },
      utm_medium: { type: String, default: null },
      utm_campaign: { type: String, default: null },
      utm_term: { type: String, default: null },
      utm_content: { type: String, default: null }
    },
    
    // Bot filtering settings
    excludeBotTraffic: { type: Boolean, default: true },
    
    // Conversion tracking settings
    conversionTracking: {
      enabled: { type: Boolean, default: false },
      pixels: [{ type: mongoose.Schema.Types.ObjectId, ref: "ConversionPixel" }]
    },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    safetyStatus: { type: String, enum: ["safe", "suspicious", "blocked"], default: "safe" },
    safetyReason: { type: String, default: "" },
    disabledByAdmin: { type: Boolean, default: false },
    disabledAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

// Index for faster lookups
linkSchema.index({ shortCode: 1, domain: 1 }, { unique: true });
linkSchema.index({ userId: 1, createdAt: -1 });
linkSchema.index({ workspaceId: 1, createdAt: -1 });
linkSchema.index({ expiresAt: 1 }); // For expiry cleanup jobs
linkSchema.index({ tags: 1 });
linkSchema.index({ isActive: 1 });
linkSchema.index({ isDeleted: 1 });
linkSchema.index({ safetyStatus: 1 });

// Query middleware to exclude soft-deleted links by default
linkSchema.pre(/^find/, function() {
  const filter = this.getFilter();
  if (filter.isDeleted === undefined) {
    filter.isDeleted = { $ne: true };
  }
});

linkSchema.pre("countDocuments", function() {
  const filter = this.getFilter();
  if (filter.isDeleted === undefined) {
    filter.isDeleted = { $ne: true };
  }
});

module.exports = mongoose.model("Link", linkSchema);


