const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    customSlug: { type: String, default: null },
    domain: { type: String, default: "shrinkly.link" },
    clicks: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    tags: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", linkSchema);
