const mongoose = require("mongoose");

// Conversion pixel configuration for tracking
const conversionPixelSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Link",
      required: true,
      index: true
    },
    pixelId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventTypes: {
      type: [String],
      enum: ["signup", "purchase", "form_submit", "download", "custom"],
      required: true
    },
    conversionValue: {
      type: Number,
      default: 0,
      description: "Expected conversion value in cents"
    },
    pixelScript: {
      type: String,
      default: null,
      description: "JavaScript tracking script for this pixel"
    },
    pixelUrl: {
      type: String,
      default: null,
      description: "Pixel tracking URL"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Index for faster lookups
conversionPixelSchema.index({ linkId: 1, pixelId: 1 });

module.exports = mongoose.model("ConversionPixel", conversionPixelSchema);
