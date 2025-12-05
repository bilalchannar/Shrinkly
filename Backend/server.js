require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

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
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

// Use routes
app.use("/api", linkRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/qrcode", qrcodeRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Redirect route for short links with analytics tracking
app.get("/r/:code", async (req, res) => {
  const Link = require("./models/Link");
  const { recordClick } = require("./controllers/analyticsController");
  
  try {
    const code = req.params.code;
    const isQrScan = req.query.qr === "1";
    const link = await Link.findOne({ shortCode: code });

    if (!link) {
      return res.status(404).send("Link not found");
    }

    if (link.status === "inactive") {
      return res.status(403).send("This link has been deactivated");
    }

    // Track click in Link model
    link.clicks += 1;
    await link.save();
    
    // Record detailed analytics
    await recordClick(link._id, code, req, isQrScan);

    res.redirect(link.originalUrl);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
