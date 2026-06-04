const mongoose = require("mongoose");

const customDomainSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending"
    },
    verificationToken: {
      type: String,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomDomain", customDomainSchema);
