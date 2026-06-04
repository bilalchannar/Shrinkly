require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/users");
const Link = require("../models/Link");
const Analytics = require("../models/Analytics");
const QRCode = require("../models/QRCode");
const ReportLog = require("../models/ReportLog");
const Contact = require("../models/Contact");
const Notification = require("../models/Notification");

const DEMO_EMAIL = "demo@shrinkly.com";

// Helper to get random item from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date within last N days
const randomDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * days));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
};

async function seed() {
  await connectDB();
  console.log("🌱 Starting seed process...");

  // Check if demo user already exists
  let demoUser = await User.findOne({ email: DEMO_EMAIL });

  if (demoUser) {
    console.log("✅ Demo user already exists. Skipping user creation.");
  } else {
    const hashedPassword = await bcrypt.hash("Demo123", 10);
    demoUser = new User({
      username: "DemoUser",
      email: DEMO_EMAIL,
      password: hashedPassword,
      displayName: "Demo User",
      bio: "This is a demo account for exploring Shrinkly features.",
      company: "Shrinkly Demo",
      location: "San Francisco, CA",
      plan: "pro",
      role: "user",
      emailVerified: true,
    });
    await demoUser.save();
    console.log("✅ Demo user created: demo@shrinkly.com / Demo123");
  }

  const userId = demoUser._id;

  // Check if demo links already exist
  const existingLinks = await Link.countDocuments({ userId });
  if (existingLinks > 0) {
    console.log(`✅ Demo user already has ${existingLinks} links. Skipping link seeding.`);
  } else {
    // Create sample links
    const sampleLinks = [
      { originalUrl: "https://github.com/trending", shortCode: "gh-trending", tags: ["developer", "github"], clicks: 284 },
      { originalUrl: "https://react.dev/learn", shortCode: "learn-react", tags: ["education", "developer"], clicks: 197 },
      { originalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", shortCode: "yt-demo", tags: ["video", "social"], clicks: 523 },
      { originalUrl: "https://linkedin.com/in/demo-profile", shortCode: "my-linkedin", tags: ["professional", "personal-brand"], clicks: 156 },
      { originalUrl: "https://store.example.com/summer-sale", shortCode: "summer-sale", tags: ["ecommerce", "marketing"], clicks: 891 },
      { originalUrl: "https://blog.example.com/best-practices", shortCode: "blog-tips", tags: ["content", "education"], clicks: 342 },
      { originalUrl: "https://docs.example.com/api-guide", shortCode: "api-docs", tags: ["developer", "education"], clicks: 178 },
      { originalUrl: "https://portfolio.example.com", shortCode: "my-portfolio", tags: ["personal-brand"], clicks: 95 },
      { originalUrl: "https://twitter.com/shrinkly", shortCode: "shrinkly-x", tags: ["social", "marketing"], clicks: 412 },
      { originalUrl: "https://medium.com/@demo/getting-started", shortCode: "blog-start", tags: ["content"], clicks: 267 },
      { originalUrl: "https://example.com/expired-promo", shortCode: "old-promo", tags: ["marketing"], clicks: 50, status: "expired" },
      { originalUrl: "https://example.com/limited-link", shortCode: "limited", tags: ["marketing"], clicks: 100, maxClicks: 100 },
    ];

    const createdLinks = [];
    for (const link of sampleLinks) {
      const newLink = new Link({
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        customSlug: link.shortCode,
        domain: "shrinkly.link",
        clicks: link.clicks,
        tags: link.tags,
        userId,
        createdBy: userId,
        status: link.status || "active",
        maxClicks: link.maxClicks || null,
        createdAt: randomDate(90),
      });
      await newLink.save();
      createdLinks.push(newLink);
    }
    console.log(`✅ Created ${createdLinks.length} sample links`);

    // Create sample analytics
    const devices = ["desktop", "mobile", "tablet"];
    const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
    const oses = ["Windows", "macOS", "Android", "iOS", "Linux"];
    const countries = ["United States", "United Kingdom", "Germany", "India", "Canada", "France", "Japan", "Brazil", "Australia"];
    const cities = ["New York", "London", "Berlin", "Mumbai", "Toronto", "Paris", "Tokyo", "São Paulo", "Sydney"];
    const referrers = ["direct", "google.com", "facebook.com", "twitter.com", "linkedin.com", "reddit.com", "instagram.com"];

    let analyticsCount = 0;
    for (const link of createdLinks) {
      const clickCount = Math.min(link.clicks, 50); // Cap at 50 analytics records per link
      for (let i = 0; i < clickCount; i++) {
        const countryIdx = Math.floor(Math.random() * countries.length);
        const analytics = new Analytics({
          linkId: link._id,
          userId,
          shortCode: link.shortCode,
          device: pick(devices),
          browser: pick(browsers),
          os: pick(oses),
          country: countries[countryIdx],
          city: cities[countryIdx],
          referrer: pick(referrers),
          referrerDomain: pick(referrers),
          isQrScan: Math.random() < 0.15,
          clickedAt: randomDate(60),
        });
        await analytics.save();
        analyticsCount++;
      }
    }
    console.log(`✅ Created ${analyticsCount} analytics records`);

    // Create sample QR codes
    const sampleQRs = [
      { name: "GitHub Trending QR", destinationUrl: "https://github.com/trending", scanCount: 84 },
      { name: "LinkedIn Profile QR", destinationUrl: "https://linkedin.com/in/demo-profile", scanCount: 45 },
      { name: "Summer Sale QR", destinationUrl: "https://store.example.com/summer-sale", scanCount: 127 },
      { name: "Portfolio QR", destinationUrl: "https://portfolio.example.com", scanCount: 32 },
    ];

    for (const qr of sampleQRs) {
      const newQR = new QRCode({
        userId,
        destinationUrl: qr.destinationUrl,
        title: qr.name,
        name: qr.name,
        scanCount: qr.scanCount,
        scans: qr.scanCount,
        createdAt: randomDate(60),
      });
      await newQR.save();
    }
    console.log(`✅ Created ${sampleQRs.length} QR codes`);

    // Create sample report logs
    const reportTypes = ["daily", "weekly", "monthly"];
    for (let i = 0; i < 5; i++) {
      const report = new ReportLog({
        userId,
        reportType: pick(reportTypes),
        recipientEmail: DEMO_EMAIL,
        status: i === 3 ? "failed" : "sent",
        summaryData: {
          totalLinks: 12,
          totalClicks: 3495,
          activeLinks: 10,
          expiredLinks: 1,
          topLink: { shortCode: "summer-sale", clicks: 891 },
          topCountry: { country: "United States", clicks: 1247 },
          deviceBreakdown: { desktop: 1500, mobile: 1600, tablet: 395 },
          qrScans: 288,
        },
        errorMessage: i === 3 ? "SMTP connection timeout" : null,
        sentAt: randomDate(30),
      });
      await report.save();
    }
    console.log("✅ Created 5 report logs");

    // Create sample contact tickets
    const tickets = [
      { fullName: "John Smith", email: "john@example.com", subject: "Feature Request", message: "Can you add dark mode to the landing page?", status: "replied" },
      { fullName: "Sarah Johnson", email: "sarah@example.com", subject: "Bug Report", message: "QR code download not working on Safari", status: "read" },
      { fullName: "Mike Chen", email: "mike@example.com", subject: "General Inquiry", message: "What are the enterprise plan limits?", status: "new" },
    ];

    for (const ticket of tickets) {
      const contact = new Contact({ ...ticket, createdAt: randomDate(14) });
      await contact.save();
    }
    console.log("✅ Created 3 contact tickets");

    // Create sample notifications
    const notifications = [
      { type: "success", title: "Report Delivered", message: "Your weekly analytics report has been sent to demo@shrinkly.com", isRead: true },
      { type: "warning", title: "Link Expired", message: "Your short link /r/old-promo has expired.", isRead: false },
      { type: "danger", title: "Click Limit Reached", message: "Your link /r/limited has reached its limit of 100 clicks and has been deactivated.", isRead: false },
      { type: "info", title: "Welcome to Shrinkly!", message: "Start by creating your first short link from the Link Management page.", isRead: true },
      { type: "success", title: "QR Code Milestone", message: "Your QR code 'Summer Sale QR' has reached 100 scans!", isRead: false },
    ];

    for (const notif of notifications) {
      const n = new Notification({
        userId,
        ...notif,
        createdAt: randomDate(7),
      });
      await n.save();
    }
    console.log("✅ Created 5 notifications");
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("📧 Demo login: demo@shrinkly.com / Demo123\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
