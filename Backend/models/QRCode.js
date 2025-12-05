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
  downloads: { 
    type: Number, 
    default: 0 
  },
  scans: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  }
}, { timestamps: true });

module.exports = mongoose.model("QRCode", qrCodeSchema);
