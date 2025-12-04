const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", linkSchema);
