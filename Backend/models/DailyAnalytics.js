const mongoose = require("mongoose");

const dailyAnalyticsSchema = new mongoose.Schema(
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

// Compound index to ensure uniqueness per link and date
dailyAnalyticsSchema.index({ linkId: 1, date: 1 }, { unique: true });
dailyAnalyticsSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("DailyAnalytics", dailyAnalyticsSchema);
