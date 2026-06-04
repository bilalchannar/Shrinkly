const mongoose = require("mongoose");

const deviceAnalyticsSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      index: true 
    },
    linkId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Link", 
      required: true, 
      index: true 
    },
    date: { 
      type: Date, 
      required: true, 
      index: true 
    },
    device: { 
      type: String, 
      default: "unknown", 
      index: true 
    },
    clicks: { 
      type: Number, 
      default: 0 
    },
    uniqueVisitors: { 
      type: Number, 
      default: 0 
    },
    qrScans: { 
      type: Number, 
      default: 0 
    }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per link, date, and device type
deviceAnalyticsSchema.index({ linkId: 1, date: 1, device: 1 }, { unique: true });

module.exports = mongoose.model("DeviceAnalytics", deviceAnalyticsSchema);
