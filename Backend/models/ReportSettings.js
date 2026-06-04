const mongoose = require("mongoose");

const reportSettingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ["daily", "weekly", "monthly", "custom"], default: "daily" },
    dayOfWeek: { type: Number, min: 0, max: 6, default: null }, // 0-6 for weekly reports (0=Sunday)
    dayOfMonth: { type: Number, min: 1, max: 31, default: null }, // 1-31 for monthly reports
    time: { type: String, default: "09:00" }, // HH:mm format
    recipientEmail: { type: String, required: true },
    lastSentAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Unique index on userId to ensure only one settings doc per user
reportSettingsSchema.index({ userId: 1 }, { unique: true });

// Index for querying next reports to send
reportSettingsSchema.index({ enabled: 1, nextRunAt: 1 });
reportSettingsSchema.index({ enabled: 1 });
reportSettingsSchema.index({ nextRunAt: 1 });

module.exports = mongoose.model("ReportSettings", reportSettingsSchema);
