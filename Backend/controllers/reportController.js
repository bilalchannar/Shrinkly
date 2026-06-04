const ReportSettings = require("../models/ReportSettings");
const ReportLog = require("../models/ReportLog");
const User = require("../models/users");
const sendEmail = require("../utils/sendEmail");
const { reportEmailTemplate } = require("../utils/reportEmailTemplate");
const { generateReportSummary, calculateNextRunAt } = require("../services/reportService");

// GET /api/reports/settings — get user's report settings
const getReportSettings = async (req, res) => {
  try {
    let settings = await ReportSettings.findOne({ userId: req.userId });

    if (!settings) {
      // Return default settings (not saved yet)
      return res.json({
        success: true,
        settings: {
          enabled: false,
          frequency: "weekly",
          dayOfWeek: 1,
          dayOfMonth: 1,
          time: "09:00",
          recipientEmail: "",
          lastSentAt: null,
          nextRunAt: null
        }
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error getting report settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/reports/settings — create report settings
const createReportSettings = async (req, res) => {
  try {
    // Check if settings already exist for this user
    const existing = await ReportSettings.findOne({ userId: req.userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Report settings already exist. Use PATCH to update."
      });
    }

    const { enabled, frequency, dayOfWeek, dayOfMonth, time, recipientEmail } = req.body;

    // Validate recipientEmail
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: "Recipient email is required."
      });
    }

    const settingsData = {
      userId: req.userId,
      enabled: enabled || false,
      frequency: frequency || "weekly",
      dayOfWeek: dayOfWeek != null ? dayOfWeek : 1,
      dayOfMonth: dayOfMonth || 1,
      time: time || "09:00",
      recipientEmail
    };

    // Calculate nextRunAt if reports are enabled
    if (settingsData.enabled) {
      settingsData.nextRunAt = calculateNextRunAt(settingsData);
    }

    const settings = new ReportSettings(settingsData);
    await settings.save();

    res.status(201).json({ success: true, settings });
  } catch (error) {
    console.error("Error creating report settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/reports/settings — update report settings
const updateReportSettings = async (req, res) => {
  try {
    let settings = await ReportSettings.findOne({ userId: req.userId });

    // If no settings exist yet, create them
    if (!settings) {
      if (!req.body.recipientEmail) {
        return res.status(400).json({
          success: false,
          message: "Recipient email is required when creating settings."
        });
      }
      settings = new ReportSettings({ userId: req.userId, recipientEmail: req.body.recipientEmail });
    }

    // Update allowed fields from request body
    const allowedFields = ["enabled", "frequency", "dayOfWeek", "dayOfMonth", "time", "recipientEmail"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    // Recalculate nextRunAt if enabled
    if (settings.enabled) {
      settings.nextRunAt = calculateNextRunAt(settings);
    } else {
      settings.nextRunAt = null;
    }

    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating report settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/reports/send-now — send report immediately
const sendReportNow = async (req, res) => {
  try {
    // Get user info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get report settings for recipient email, fall back to user's email
    const settings = await ReportSettings.findOne({ userId: req.userId });
    const recipientEmail = settings?.recipientEmail || user.email;
    const frequency = settings?.frequency || "weekly";

    // Generate the report summary
    const summary = await generateReportSummary(req.userId, frequency);

    // Generate the HTML email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const displayName = user.displayName || user.username;
    const html = reportEmailTemplate(displayName, frequency, summary, frontendUrl);

    // Send the email
    const subject = `📊 Your ${frequency} Shrinkly performance report`;
    await sendEmail(recipientEmail, subject, html);

    // Create a ReportLog entry
    await ReportLog.create({
      userId: req.userId,
      reportType: frequency === "custom" ? "weekly" : frequency,
      recipientEmail,
      status: "sent",
      summaryData: summary,
      sentAt: new Date()
    });

    // Update lastSentAt on settings if they exist
    if (settings) {
      settings.lastSentAt = new Date();
      settings.nextRunAt = calculateNextRunAt(settings);
      await settings.save();
    }

    res.json({ success: true, message: "Report sent successfully" });
  } catch (error) {
    console.error("Error sending report:", error);

    // Log the failure
    try {
      const settings = await ReportSettings.findOne({ userId: req.userId });
      await ReportLog.create({
        userId: req.userId,
        reportType: settings?.frequency === "custom" ? "weekly" : (settings?.frequency || "weekly"),
        recipientEmail: settings?.recipientEmail || "unknown",
        status: "failed",
        errorMessage: error.message,
        sentAt: new Date()
      });
    } catch (logErr) {
      console.error("Error creating failure log:", logErr);
    }

    res.status(500).json({ success: false, message: "Failed to send report" });
  }
};

// GET /api/reports/logs — get report history
const getReportLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ReportLog.find({ userId: req.userId })
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit),
      ReportLog.countDocuments({ userId: req.userId })
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error getting report logs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getReportSettings,
  createReportSettings,
  updateReportSettings,
  sendReportNow,
  getReportLogs
};
