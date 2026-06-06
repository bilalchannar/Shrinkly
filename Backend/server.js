require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const startCleanupJob = require("./jobs/cleanupJob");
const startReportJobs = require("./jobs/reportJob");
const errorMiddleware = require("./middleware/errorMiddleware");
const passport = require("passport");
require("./config/passport");

// Import routes
const linkRoutes = require("./routes/link");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
const profileRoutes = require("./routes/profile");
const qrcodeRoutes = require("./routes/qrcode");
const contactRoutes = require("./routes/contact");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const trackRoutes = require("./routes/track");
const reportRoutes = require("./routes/report");
const userRoutes = require("./routes/users");
const workspaceRoutes = require("./routes/workspaces");
const customDomainRoutes = require("./routes/customDomain");
const apiKeyRoutes = require("./routes/apiKey");
const v1Routes = require("./routes/v1");
const abuseRoutes = require("./routes/abuse");
const exportImportRoutes = require("./routes/exportImport");
const notificationRoutes = require("./routes/notification");
const smartRoutes = require("./routes/smart");
const publicRoutes = require("./routes/public");

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: []
  }
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// CORS
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002"
    ];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(passport.initialize());

// Connect to MongoDB
connectDB().then(() => {
  startCronJobs(); // Start cron jobs after DB is connected
});

// Custom Domain Redirect Middleware
app.use(async (req, res, next) => {
  try {
    const host = req.headers.host;
    if (!host) return next();

    const domainName = host.split(":")[0].toLowerCase();
    
    // Ignore internal domains and main frontend/backend domains
    const mainDomains = [
      "localhost", 
      "127.0.0.1", 
      "shrinkly.link", 
      "shrinkly.app", 
      "shrinkly.herokuapp.com"
    ];
    if (mainDomains.includes(domainName)) {
      return next();
    }

    // Ignore core API, health and static paths
    if (
      req.path.startsWith("/api") || 
      req.path.startsWith("/health") || 
      req.path.startsWith("/static") ||
      req.path.startsWith("/favicon.ico")
    ) {
      return next();
    }

    // Check if this domain is a verified custom domain
    const CustomDomain = require("./models/CustomDomain");
    const verifiedDomain = await CustomDomain.findOne({ domain: domainName, status: "verified" });
    if (!verifiedDomain) {
      return next(); // If not a verified custom domain, pass to next routes
    }

    // Extract short code
    const code = req.path.replace(/^\/(r\/)?/, "");
    if (!code) {
      // Direct root access on custom domain -> redirect to main app or default landing
      return res.redirect("https://shrinkly.link");
    }

    const Link = require("./models/Link");
    const { recordClick } = require("./controllers/analyticsController");

    // Look up link matching this custom domain and short code
    const link = await Link.findOne({ shortCode: code, domain: domainName });
    if (!link) {
      return res.status(404).send("Link not found on this custom domain");
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    if (link.safetyStatus === "blocked" || link.disabledByAdmin) {
      return res.redirect(`${frontendUrl}/warning?status=blocked&code=${code}&domain=${domainName}&url=${encodeURIComponent(link.originalUrl)}`);
    }

    if (link.safetyStatus === "suspicious" && req.query.continue !== "1") {
      return res.redirect(`${frontendUrl}/warning?status=suspicious&code=${code}&domain=${domainName}&url=${encodeURIComponent(link.originalUrl)}`);
    }

    if (link.status === "inactive") {
      return res.redirect(`${frontendUrl}/disabled?code=${code}&domain=${domainName}`);
    }

    // Check expiry
    if (link.expiresAt && new Date() > link.expiresAt) {
      await Link.findByIdAndUpdate(link._id, { $set: { status: 'expired' } });
      const { createNotification } = require("./services/notificationService");
      if (link.userId) {
        await createNotification(
          link.userId,
          "warning",
          "Link Expired",
          `Your short link /r/${link.shortCode} has expired.`,
          { linkId: link._id, slug: link.shortCode }
        );
      }
      return res.redirect(`${frontendUrl}/expired?code=${code}&domain=${domainName}`);
    }

    // Check click limit
    if (link.maxClicks && link.clicks >= link.maxClicks) {
      await Link.findByIdAndUpdate(link._id, { $set: { status: 'inactive' } });
      const { createNotification } = require("./services/notificationService");
      if (link.userId) {
        await createNotification(
          link.userId,
          "danger",
          "Click Limit Reached",
          `Your short link /r/${link.shortCode} has reached its limit of ${link.maxClicks} clicks and has been deactivated.`,
          { linkId: link._id, slug: link.shortCode }
        );
      }
      return res.redirect(`${frontendUrl}/limit-reached?code=${code}&domain=${domainName}`);
    }

    // Password check
    if (link.password) {
      const providedPassword = req.query.pw;
      if (!providedPassword) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(`${frontendUrl}/link-password?code=${code}&domain=${domainName}`);
      }
      const bcrypt = require("bcryptjs");
      const isMatch = await bcrypt.compare(providedPassword, link.password);
      if (!isMatch) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(`${frontendUrl}/link-password?code=${code}&domain=${domainName}&error=wrong`);
      }
    }

    // Increment clicks and record analytics
    await Link.findByIdAndUpdate(link._id, { $inc: { clicks: 1 } });
    await recordClick(link._id, code, req, req.query.qr === "1");

    return res.redirect(link.originalUrl);
  } catch (error) {
    console.error("Custom domain redirect middleware error:", error);
    return res.status(500).send("Server error");
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global API rate limiter
const { apiLimiter } = require("./utils/rateLimiters");
app.use('/api', apiLimiter);

// Use routes
app.use("/api", linkRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/qrcode", qrcodeRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/domains", customDomainRoutes);
app.use("/api/api-keys", apiKeyRoutes);
app.use("/api/v1", v1Routes);
app.use("/api/abuse", abuseRoutes);
app.use("/api", exportImportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/smart", smartRoutes);
app.use("/api/public", publicRoutes);

// ======================== REDIRECT ROUTE ========================
// Handles short link redirects with analytics tracking and feature checks
const { redirectLimiter } = require("./utils/rateLimiters");
app.get("/r/:code", redirectLimiter, async (req, res) => {
  const Link = require("./models/Link");
  const { recordClick } = require("./controllers/analyticsController");
  const bcrypt = require("bcryptjs");

  try {
    const code = req.params.code;
    const isQrScan = req.query.qr === "1";
    const link = await Link.findOne({ shortCode: code });

    if (!link) return res.status(404).send("Link not found");

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    if (link.safetyStatus === "blocked" || link.disabledByAdmin) {
      return res.redirect(`${frontendUrl}/warning?status=blocked&code=${code}&url=${encodeURIComponent(link.originalUrl)}`);
    }

    if (link.safetyStatus === "suspicious" && req.query.continue !== "1") {
      return res.redirect(`${frontendUrl}/warning?status=suspicious&code=${code}&url=${encodeURIComponent(link.originalUrl)}`);
    }

    if (link.status === "inactive") {
      return res.redirect(`${frontendUrl}/disabled?code=${code}`);
    }

    // Check expiry
    if (link.expiresAt && new Date() > link.expiresAt) {
      await Link.findByIdAndUpdate(link._id, { $set: { status: 'expired' } });
      const { createNotification } = require("./services/notificationService");
      if (link.userId) {
        await createNotification(
          link.userId,
          "warning",
          "Link Expired",
          `Your short link /r/${link.shortCode} has expired.`,
          { linkId: link._id, slug: link.shortCode }
        );
      }
      return res.redirect(`${frontendUrl}/expired?code=${code}`);
    }

    // Check click limit
    if (link.maxClicks && link.clicks >= link.maxClicks) {
      await Link.findByIdAndUpdate(link._id, { $set: { status: 'inactive' } });
      const { createNotification } = require("./services/notificationService");
      if (link.userId) {
        await createNotification(
          link.userId,
          "danger",
          "Click Limit Reached",
          `Your short link /r/${link.shortCode} has reached its limit of ${link.maxClicks} clicks and has been deactivated.`,
          { linkId: link._id, slug: link.shortCode }
        );
      }
      return res.redirect(`${frontendUrl}/limit-reached?code=${code}`);
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

    // Track click (atomic increment)
    await Link.findByIdAndUpdate(link._id, { $inc: { clicks: 1 } });
    await recordClick(link._id, code, req, isQrScan);

    res.redirect(link.originalUrl);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).send("Server error");
  }
});

// ======================== CRON JOBS ========================
function startCronJobs() {
  if (process.env.CRON_ENABLED === "false") {
    console.log("⏰ Cron jobs are disabled via CRON_ENABLED=false");
    return;
  }
  startCleanupJob();
  startReportJobs();
}

// Central Error Handler Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
