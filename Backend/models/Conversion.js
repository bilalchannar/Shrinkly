const mongoose = require("mongoose");

// Individual conversion tracking
const conversionSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Link",
      required: true,
      index: true
    },
    pixelId: {
      type: String,
      required: true,
      index: true
    },
    event: {
      type: String,
      enum: ["signup", "purchase", "form_submit", "download", "custom"],
      required: true,
      index: true
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      description: "Custom event data (e.g., { amount: 9999, itemId: 'abc123' })"
    },
    visitorHash: {
      type: String,
      index: true,
      description: "Hash of visitor (IP + User Agent)"
    },
    // IP hash for privacy - not raw IP
    ipHash: {
      type: String,
      default: null,
      index: true
    },
    userAgentHash: {
      type: String,
      default: null
    },
    // For reference - optional raw data if needed
    userAgent: {
      type: String,
      default: null
    },
    conversionValue: {
      type: Number,
      default: 0,
      description: "Conversion value in cents"
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for common queries
conversionSchema.index({ linkId: 1, event: 1, timestamp: -1 });
conversionSchema.index({ pixelId: 1, timestamp: -1 });
conversionSchema.index({ event: 1, timestamp: -1 });

// Auto-delete conversions after 1 year
conversionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model("Conversion", conversionSchema);
