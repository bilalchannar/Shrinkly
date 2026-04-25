require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");

// Import routes
const linkRoutes = require("./routes/link");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
const profileRoutes = require("./routes/profile");
const qrcodeRoutes = require("./routes/qrcode");
const contactRoutes = require("./routes/contact");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ DB connected");
    startCronJobs(); // Start cron jobs after DB is connected
  })
  .catch(err => console.error("❌ DB connection error:", err));

// Use routes
app.use("/api", linkRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/qrcode", qrcodeRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ======================== REDIRECT ROUTE ========================
// Handles short link redirects with analytics tracking and feature checks
app.get("/r/:code", async (req, res) => {
  const Link = require("./models/Link");
  const { recordClick } = require("./controllers/analyticsController");
  const bcrypt = require("bcryptjs");

  try {
    const code = req.params.code;
    const isQrScan = req.query.qr === "1";
    const link = await Link.findOne({ shortCode: code });

    if (!link) return res.status(404).send("Link not found");
    if (link.status === "inactive") return res.status(403).send("This link has been deactivated");

    // Check expiry
    if (link.expiresAt && new Date() > link.expiresAt) {
      link.status = "expired";
      await link.save();
      return res.status(410).send("This link has expired");
    }

    // Check click limit
    if (link.maxClicks && link.clicks >= link.maxClicks) {
      link.status = "inactive";
      await link.save();
      return res.status(403).send("This link has reached its click limit");
    }

    // Password-protected link — redirect to frontend password page
    if (link.password) {
      const providedPassword = req.query.pw;
      if (!providedPassword) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(`${frontendUrl}/link-password?code=${code}`);
      }
      const isMatch = await bcrypt.compare(providedPassword, link.password);
      if (!isMatch) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(`${frontendUrl}/link-password?code=${code}&error=wrong`);
      }
    }

    // Track click
    link.clicks += 1;
    await link.save();
    await recordClick(link._id, code, req, isQrScan);

    res.redirect(link.originalUrl);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).send("Server error");
  }
});

// ======================== CRON JOBS ========================
function startCronJobs() {
  const Link = require("./models/Link");
  const User = require("./models/users");
  const sendEmail = require("./utils/sendEmail");

  // Run every hour — mark expired links
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await Link.updateMany(
        { expiresAt: { $lte: new Date() }, status: "active" },
        { $set: { status: "expired" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`⏰ Cron: marked ${result.modifiedCount} link(s) as expired`);
      }
    } catch (err) {
      console.error("Cron expiry job error:", err);
    }
  });

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
        } catch (emailErr) {
          console.error(`Failed to send weekly report to ${user.email}:`, emailErr.message);
        }
      }
      console.log(`✅ Weekly reports sent to ${users.length} users`);
    } catch (err) {
      console.error("Weekly report cron error:", err);
    }
  });

  console.log("✅ Cron jobs scheduled");
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
