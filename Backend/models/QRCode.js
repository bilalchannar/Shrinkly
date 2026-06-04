const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  linkId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Link",
    default: null
  },
  destinationUrl: { 
    type: String, 
    required: true 
  },
  shortUrl: { 
    type: String,
    default: null
  },
  title: { 
    type: String, 
    default: "" 
  },
  name: {
    type: String,
    default: ""
  },
  qrColor: { 
    type: String, 
    default: "#6f42c1" 
  },
  bgColor: { 
    type: String, 
    default: "#ffffff" 
  },
  size: { 
    type: Number, 
    default: 200 
  },
  qrOptions: {
    type: Object,
    default: {}
  },
  downloads: { 
    type: Number, 
    default: 0 
  },
  scans: { 
    type: Number, 
    default: 0 
  },
  scanCount: {
    type: Number,
    default: 0
  },
  shortLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Link",
    default: null
  },
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true }
}, { timestamps: true });

// New indexes for fast lookups
qrCodeSchema.index({ userId: 1 });
qrCodeSchema.index({ shortLinkId: 1 });
qrCodeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("QRCode", qrCodeSchema);
