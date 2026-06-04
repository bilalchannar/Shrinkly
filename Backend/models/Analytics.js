const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    linkId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Link", 
      required: true,
      index: true
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      index: true
    },
    shortCode: { type: String, required: true, index: true },
    
    // Visitor information
    ipHash: { type: String, default: "" },
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
    
    // Bot detection
    isBot: { type: Boolean, default: false, index: true },
    botName: { type: String, default: null },
    
    // Visitor fingerprinting
    visitorHash: { type: String, default: null, index: true },
    isReturning: { type: Boolean, default: false },
    
    // UTM campaign parameters
    utmParams: {
      utm_source: { type: String, default: null },
      utm_medium: { type: String, default: null },
      utm_campaign: { type: String, default: null },
      utm_term: { type: String, default: null },
      utm_content: { type: String, default: null }
    },
    
    // Timestamp
    clickedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
analyticsSchema.index({ linkId: 1, clickedAt: -1 });
analyticsSchema.index({ shortCode: 1, clickedAt: -1 });
analyticsSchema.index({ linkId: 1, visitorHash: 1 });
analyticsSchema.index({ linkId: 1, isBot: 1, clickedAt: -1 });
analyticsSchema.index({ linkId: 1, "utmParams.utm_source": 1 });
analyticsSchema.index({ userId: 1, clickedAt: -1 });

// New indexes for fast filtering and analytics
analyticsSchema.index({ country: 1 });
analyticsSchema.index({ city: 1 });
analyticsSchema.index({ device: 1 });
analyticsSchema.index({ browser: 1 });
analyticsSchema.index({ referrer: 1 });

module.exports = mongoose.model("Analytics", analyticsSchema);
