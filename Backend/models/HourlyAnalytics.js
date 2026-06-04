const mongoose = require("mongoose");

const hourlyAnalyticsSchema = new mongoose.Schema(
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
    hour: { 
      type: Date, 
      required: true, 
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

// Compound index to ensure uniqueness per link and hour
hourlyAnalyticsSchema.index({ linkId: 1, hour: 1 }, { unique: true });
hourlyAnalyticsSchema.index({ userId: 1, hour: 1 });

module.exports = mongoose.model("HourlyAnalytics", hourlyAnalyticsSchema);
