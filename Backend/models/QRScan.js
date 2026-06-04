const mongoose = require("mongoose");

const qrScanSchema = new mongoose.Schema(
  {
    qrCodeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "QRCode", 
      required: true,
      index: true
    },
    device: { 
      type: String, 
      enum: ["mobile", "desktop", "tablet", "unknown"], 
      default: "unknown" 
    },
    browser: { type: String, default: "unknown" },
    os: { type: String, default: "unknown" },
    country: { type: String, default: "unknown" },
    city: { type: String, default: "unknown" },
    referrer: { type: String, default: "direct" },
    scannedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

// Index for query efficiency in reporting
qrScanSchema.index({ qrCodeId: 1, scannedAt: -1 });

module.exports = mongoose.model("QRScan", qrScanSchema);
