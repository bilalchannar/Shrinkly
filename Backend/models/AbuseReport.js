const mongoose = require("mongoose");

const abuseReportSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Link",
      default: null,
      index: true
    },
    shortUrl: {
      type: String,
      required: true,
      trim: true
    },
    reportedUrl: {
      type: String,
      default: ""
    },
    reason: {
      type: String,
      required: true,
      enum: ["phishing", "malware", "spam", "inappropriate", "other"]
    },
    details: {
      type: String,
      required: true,
      trim: true
    },
    reporterEmail: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AbuseReport", abuseReportSchema);
