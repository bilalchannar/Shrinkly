const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    keyPreview: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active"
    },
    usageCount: {
      type: Number,
      default: 0
    },
    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApiKey", apiKeySchema);
