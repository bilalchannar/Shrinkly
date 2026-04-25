const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    linkId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Link", 
      required: true,
      index: true
    },
    shortCode: { type: String, required: true, index: true },
    
    // Visitor information
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    
    // Device info
    device: { 
      type: String, 
      enum: ["mobile", "desktop", "tablet", "unknown"], 
      default: "unknown" 
    },
    browser: { type: String, default: "unknown" },
    os: { type: String, default: "unknown" },
    
    // Location info
    country: { type: String, default: "unknown" },
    city: { type: String, default: "unknown" },
    
    // Traffic source
    referrer: { type: String, default: "direct" },
    referrerDomain: { type: String, default: "direct" },
    
    // QR code scan
    isQrScan: { type: Boolean, default: false },
    
    // Timestamp
    clickedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
analyticsSchema.index({ linkId: 1, clickedAt: -1 });
analyticsSchema.index({ shortCode: 1, clickedAt: -1 });

module.exports = mongoose.model("Analytics", analyticsSchema);
