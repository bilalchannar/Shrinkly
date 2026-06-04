const cron = require("node-cron");
const Link = require("../models/Link");
const User = require("../models/users");
const sendEmail = require("../utils/sendEmail");
const ReportSettings = require("../models/ReportSettings");
const ReportLog = require("../models/ReportLog");
const { generateReportSummary } = require("../services/reportService");
const calculateNextRunAt = require("../utils/calculateNextReportRun");
const { reportEmailTemplate } = require("../utils/reportEmailTemplate");

/**
 * Starts report generation cron jobs.
 */
const startReportJobs = () => {
  // Run every Monday at 9:00 AM — send weekly reports
  cron.schedule("0 9 * * 1", async () => {
    console.log("📧 Cron: Running weekly report job...");
    try {
      const users = await User.find({
        "notificationSettings.weeklyReport": true,
        emailVerified: true
      });

      for (const user of users) {
        try {
          const totalLinks = await Link.countDocuments({ userId: user._id });
          const totalClicks = await Link.aggregate([
            { $match: { userId: user._id } },
            { $group: { _id: null, total: { $sum: "$clicks" } } }
          ]);

          const clicks = totalClicks[0]?.total || 0;
          const html = `
            <div style="font-family: Segoe UI, sans-serif; max-width:560px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
              <div style="background:linear-gradient(135deg,#512da8,#7b4fd4);padding:28px 40px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">🔗 Weekly Report</h1>
                <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Your Shrinkly summary for the week</p>
              </div>
              <div style="padding:36px 40px;">
                <p style="font-size:16px;color:#333;">Hi <strong>${user.displayName || user.username}</strong> 👋</p>
                <p style="color:#666;font-size:14px;">Here's your weekly performance summary:</p>
                <div style="display:flex;gap:16px;margin:20px 0;">
                  <div style="flex:1;background:#f5f0ff;border-radius:10px;padding:20px;text-align:center;">
                    <div style="font-size:32px;font-weight:700;color:#512da8;">${totalLinks}</div>
                    <div style="font-size:13px;color:#666;margin-top:4px;">Total Links</div>
                  </div>
                  <div style="flex:1;background:#f5f0ff;border-radius:10px;padding:20px;text-align:center;">
                    <div style="font-size:32px;font-weight:700;color:#512da8;">${clicks}</div>
                    <div style="font-size:13px;color:#666;margin-top:4px;">Total Clicks</div>
                  </div>
                </div>
                <p style="font-size:13px;color:#999;text-align:center;">Login to see detailed analytics →</p>
              </div>
            </div>
          `;

          await sendEmail(user.email, "📊 Your weekly Shrinkly report", html);
          const { createNotification } = require("../services/notificationService");
          await createNotification(
            user._id,
            "success",
            "Weekly Report Delivered",
            "Your weekly performance report has been compiled and sent to your email.",
            { reportType: "weekly" }
          );
        } catch (emailErr) {
          console.error(`Failed to send weekly report to ${user.email}:`, emailErr.message);
          try {
            const { createNotification } = require("../services/notificationService");
            await createNotification(
              user._id,
              "danger",
              "Weekly Report Failed",
              `We couldn't deliver your weekly report email: ${emailErr.message}`,
              { reportType: "weekly", error: emailErr.message }
            );
          } catch (notifErr) {
            console.error("Error creating weekly report failure notification:", notifErr);
          }
        }
      }
      console.log(`✅ Weekly reports sent to ${users.length} users`);
    } catch (err) {
      console.error("Weekly report cron error:", err);
    }
  });

  // Run every 5 minutes — process scheduled reports
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const dueSettings = await ReportSettings.find({
        enabled: true,
        nextRunAt: { $lte: now }
      });

      if (dueSettings.length === 0) return;
      console.log(`📧 Cron: Processing ${dueSettings.length} scheduled report(s)...`);

      for (const settings of dueSettings) {
        try {
          // Get user info
          const user = await User.findById(settings.userId);
          if (!user) {
            console.error(`Scheduled report: user ${settings.userId} not found, skipping`);
            continue;
          }

          // Generate summary
          const frequency = settings.frequency === "custom" ? "weekly" : settings.frequency;
          const summary = await generateReportSummary(settings.userId, frequency);

          // Generate and send email
          const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
          const displayName = user.displayName || user.username;
          const html = reportEmailTemplate(displayName, frequency, summary, frontendUrl);
          const subject = `📊 Your ${frequency} Shrinkly performance report`;

          await sendEmail(settings.recipientEmail, subject, html);

          // Create success log
          await ReportLog.create({
            userId: settings.userId,
            reportType: frequency,
            recipientEmail: settings.recipientEmail,
            status: "sent",
            summaryData: summary,
            sentAt: new Date()
          });

          // Trigger Notification
          const { createNotification } = require("../services/notificationService");
          await createNotification(
            settings.userId,
            "success",
            "Scheduled Report Sent",
            `Your scheduled ${frequency} report has been successfully sent to ${settings.recipientEmail}.`,
            { reportSettingsId: settings._id, frequency }
          );

          // Update settings
          settings.lastSentAt = new Date();
          settings.nextRunAt = calculateNextRunAt(settings);
          await settings.save();

          console.log(`✅ Scheduled report sent to ${settings.recipientEmail}`);
        } catch (emailErr) {
          console.error(`Failed to send scheduled report to ${settings.recipientEmail}:`, emailErr.message);

          // Create failure log
          try {
            await ReportLog.create({
              userId: settings.userId,
              reportType: settings.frequency === "custom" ? "weekly" : settings.frequency,
              recipientEmail: settings.recipientEmail,
              status: "failed",
              errorMessage: emailErr.message,
              sentAt: new Date()
            });
          } catch (logErr) {
            console.error("Error creating failure log:", logErr);
          }

          // Trigger Notification
          try {
            const { createNotification } = require("../services/notificationService");
            await createNotification(
              settings.userId,
              "danger",
              "Scheduled Report Failed",
              `We couldn't send your scheduled report to ${settings.recipientEmail}: ${emailErr.message}`,
              { reportSettingsId: settings._id, error: emailErr.message }
            );
          } catch (notifErr) {
            console.error("Error creating failure notification:", notifErr);
          }

          // Still advance nextRunAt to avoid retrying endlessly
          settings.nextRunAt = calculateNextRunAt(settings);
          await settings.save();
        }
      }
    } catch (err) {
      console.error("Scheduled report cron error:", err);
    }
  });

  console.log("⏰ Report jobs scheduled (weekly and 5-min intervals)");
};

module.exports = startReportJobs;
