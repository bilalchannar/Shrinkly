const mongoose = require("mongoose");

const reportLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportType: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
    recipientEmail: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
    summaryData: {
      totalLinks: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      activeLinks: { type: Number, default: 0 },
      expiredLinks: { type: Number, default: 0 },
      topLink: {
        shortCode: String,
        clicks: Number
      },
      topCountry: {
        country: String,
        clicks: Number
      },
      topCity: {
        city: String,
        clicks: Number
      },
      deviceBreakdown: {
        desktop: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 }
      },
      browserBreakdown: {
        chrome: { type: Number, default: 0 },
        firefox: { type: Number, default: 0 },
        safari: { type: Number, default: 0 },
        edge: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      },
      referrerBreakdown: [
        {
          referrer: String,
          clicks: Number
        }
      ],
      qrScans: { type: Number, default: 0 }
    },
    errorMessage: { type: String, default: null },
    sentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes for querying reports by user and date
reportLogSchema.index({ userId: 1 });
reportLogSchema.index({ userId: 1, sentAt: -1 });
reportLogSchema.index({ sentAt: 1 }); // For cleanup jobs
reportLogSchema.index({ status: 1 });

module.exports = mongoose.model("ReportLog", reportLogSchema);
