const express = require("express");
const router = express.Router();
const Link = require("../models/Link");
const bcrypt = require("bcryptjs");
const { recordClick } = require("../controllers/analyticsController");

// Get safe public info about a link
router.get("/links/:slug/info", async (req, res, next) => {
  try {
    const link = await Link.findOne({ shortCode: req.params.slug });

    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    // Parse destination domain
    let destinationDomain = "Unknown";
    try {
      destinationDomain = new URL(link.originalUrl).hostname;
    } catch {}

    // Determine effective status
    let effectiveStatus = link.status;
    if (link.disabledByAdmin || link.safetyStatus === "blocked") {
      effectiveStatus = "blocked";
    } else if (link.expiresAt && new Date() > link.expiresAt) {
      effectiveStatus = "expired";
    } else if (link.maxClicks && link.clicks >= link.maxClicks) {
      effectiveStatus = "limit-reached";
    } else if (link.status === "inactive") {
      effectiveStatus = "disabled";
    }

    return res.status(200).json({
      success: true,
      link: {
        slug: link.shortCode,
        destinationDomain,
        status: effectiveStatus,
        requiresPassword: !!link.password,
        safetyStatus: link.safetyStatus || "safe",
        message: effectiveStatus === "active" ? "Link is active" :
                 effectiveStatus === "expired" ? "This link has expired" :
                 effectiveStatus === "limit-reached" ? "This link has reached its click limit" :
                 effectiveStatus === "disabled" ? "This link has been disabled" :
                 effectiveStatus === "blocked" ? "This link has been blocked" :
                 "Link status unknown"
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify password for protected link
router.post("/links/:slug/verify-password", async (req, res, next) => {
  try {
    const { password } = req.body;
    const link = await Link.findOne({ shortCode: req.params.slug });

    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    if (!link.password) {
      return res.status(400).json({ success: false, message: "This link is not password protected" });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const isMatch = await bcrypt.compare(password, link.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // Password correct — record click and return destination
    await Link.findByIdAndUpdate(link._id, { $inc: { clicks: 1 } });

    return res.status(200).json({
      success: true,
      message: "Password verified",
      originalUrl: link.originalUrl
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
