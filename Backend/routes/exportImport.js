const express = require("express");
const router = express.Router();
const multer = require("multer");
const Link = require("../models/Link");
const Analytics = require("../models/Analytics");
const QRCode = require("../models/QRCode");
const { auth } = require("../middleware/authMiddleware");
const generateSlug = require("../utils/generateSlug");
const { checkUrlSafety } = require("../utils/urlSafety");
const bcrypt = require("bcryptjs");

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Helper to escape values for CSV
const cleanCsvValue = (val) => {
  if (val === undefined || val === null) return "";
  let stringVal = val.toString().replace(/"/g, '""');
  if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
    stringVal = `"${stringVal}"`;
  }
  return stringVal;
};

// ======================== EXPORT ROUTES ========================

// 1. Export Links (CSV)
router.get("/export/links.csv", auth, async (req, res, next) => {
  try {
    const links = await Link.find({ userId: req.userId });
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    const csvHeaders = ["title/name", "originalUrl", "shortUrl", "slug", "tags", "clicks", "status", "expiresAt", "createdAt"];
    
    const csvRows = links.map(link => {
      const shortUrl = link.domain && link.domain !== "shrinkly.link"
        ? `http://${link.domain}/${link.shortCode}`
        : `${baseUrl}/r/${link.shortCode}`;
        
      return [
        cleanCsvValue(link.customSlug || "Branded Link"),
        cleanCsvValue(link.originalUrl),
        cleanCsvValue(shortUrl),
        cleanCsvValue(link.shortCode),
        cleanCsvValue(link.tags.join("; ")),
        cleanCsvValue(link.clicks),
        cleanCsvValue(link.status),
        cleanCsvValue(link.expiresAt ? link.expiresAt.toISOString() : ""),
        cleanCsvValue(link.createdAt ? link.createdAt.toISOString() : "")
      ].join(",");
    });

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=links.csv");
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

// 2. Export Links (JSON)
router.get("/export/links.json", auth, async (req, res, next) => {
  try {
    const links = await Link.find({ userId: req.userId });
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=links.json");
    return res.status(200).json(links);
  } catch (error) {
    next(error);
  }
});

// 3. Export Analytics (CSV)
router.get("/export/analytics.csv", auth, async (req, res, next) => {
  try {
    // Get user's links
    const links = await Link.find({ userId: req.userId }).select("_id");
    const linkIds = links.map(l => l._id);

    const clicks = await Analytics.find({ linkId: { $in: linkIds } }).sort({ clickedAt: -1 });

    const csvHeaders = ["linkSlug", "timestamp", "country", "city", "device", "browser", "os", "referrer", "isQrScan"];
    
    const csvRows = clicks.map(c => [
      cleanCsvValue(c.shortCode),
      cleanCsvValue(c.clickedAt ? c.clickedAt.toISOString() : c.createdAt ? c.createdAt.toISOString() : ""),
      cleanCsvValue(c.country),
      cleanCsvValue(c.city),
      cleanCsvValue(c.device),
      cleanCsvValue(c.browser),
      cleanCsvValue(c.os),
      cleanCsvValue(c.referrerDomain || c.referrer),
      cleanCsvValue(c.isQrScan ? "true" : "false")
    ].join(","));

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=analytics.csv");
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

// 4. Export QR Codes (CSV)
router.get("/export/qrcodes.csv", auth, async (req, res, next) => {
  try {
    const qrCodes = await QRCode.find({ userId: req.userId });

    const csvHeaders = ["name", "destinationUrl", "scanCount", "createdAt"];
    
    const csvRows = qrCodes.map(q => [
      cleanCsvValue(q.name || q.title || "QR Code"),
      cleanCsvValue(q.destinationUrl),
      cleanCsvValue(q.scanCount || q.scans || 0),
      cleanCsvValue(q.createdAt ? q.createdAt.toISOString() : "")
    ].join(","));

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=qrcodes.csv");
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

// ======================== IMPORT ROUTES ========================

// Import Links (POST CSV)
router.post("/import/links", auth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file uploaded." });
    }

    const csvText = req.file.buffer.toString("utf8");
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
    
    if (lines.length === 0) {
      return res.status(400).json({ success: false, message: "The uploaded CSV file is empty." });
    }

    // Extract headers
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    const originalUrlIdx = headers.indexOf("originalurl");
    if (originalUrlIdx === -1) {
      return res.status(400).json({ success: false, message: "Missing required column 'originalUrl' in CSV header." });
    }

    const slugIdx = headers.indexOf("slug");
    const tagsIdx = headers.indexOf("tags");
    const expiresAtIdx = headers.indexOf("expiresat");
    const maxClicksIdx = headers.indexOf("maxclicks");

    let totalRows = lines.length - 1;
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      
      const originalUrl = values[originalUrlIdx] || "";
      const customSlug = slugIdx !== -1 ? values[slugIdx] : "";
      const rawTags = tagsIdx !== -1 ? values[tagsIdx] : "";
      const rawExpiresAt = expiresAtIdx !== -1 ? values[expiresAtIdx] : "";
      const rawMaxClicks = maxClicksIdx !== -1 ? values[maxClicksIdx] : "";

      // 1. Validate originalUrl
      if (!originalUrl) {
        errors.push({ row: i, message: "Destination originalUrl is required." });
        skippedCount++;
        continue;
      }

      try {
        const parsed = new URL(originalUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          errors.push({ row: i, message: `Only http and https URLs are allowed: '${originalUrl}'` });
          skippedCount++;
          continue;
        }
      } catch {
        errors.push({ row: i, message: `Invalid URL format: '${originalUrl}'` });
        skippedCount++;
        continue;
      }

      // 2. Validate custom slug uniqueness if provided
      let finalSlug;
      if (customSlug) {
        try {
          const existing = await Link.findOne({ shortCode: customSlug });
          if (existing) {
            errors.push({ row: i, message: `Custom slug '${customSlug}' is already in use.` });
            skippedCount++;
            continue;
          }
          finalSlug = customSlug;
        } catch (slugErr) {
          errors.push({ row: i, message: `Error verifying uniqueness for slug '${customSlug}'.` });
          skippedCount++;
          continue;
        }
      } else {
        finalSlug = require("crypto").randomBytes(3).toString("hex");
      }

      // 3. Validate expiresAt
      let expiresAt = null;
      if (rawExpiresAt) {
        const parsedDate = new Date(rawExpiresAt);
        if (isNaN(parsedDate.getTime())) {
          errors.push({ row: i, message: `Invalid expiresAt date: '${rawExpiresAt}'.` });
          skippedCount++;
          continue;
        }
        if (parsedDate <= new Date()) {
          errors.push({ row: i, message: `expiresAt date must be in the future: '${rawExpiresAt}'.` });
          skippedCount++;
          continue;
        }
        expiresAt = parsedDate;
      }

      // 4. Validate maxClicks
      let maxClicks = null;
      if (rawMaxClicks) {
        const parsedClicks = parseInt(rawMaxClicks, 10);
        if (isNaN(parsedClicks) || parsedClicks < 1) {
          errors.push({ row: i, message: `maxClicks must be a positive number: '${rawMaxClicks}'.` });
          skippedCount++;
          continue;
        }
        maxClicks = parsedClicks;
      }

      // Parse tags
      const tags = rawTags 
        ? rawTags.split(";").map(t => t.trim()).filter(Boolean) 
        : [];

      // URL Safety Validation
      const safetyResult = checkUrlSafety(originalUrl, finalSlug);
      if (!safetyResult.isSafe && safetyResult.status === "blocked") {
        errors.push({ row: i, message: `URL safety check blocked: ${safetyResult.reason}` });
        skippedCount++;
        continue;
      }

      // Create new link
      try {
        const newLink = new Link({
          originalUrl,
          shortCode: finalSlug,
          customSlug: customSlug || null,
          domain: "shrinkly.link",
          tags,
          userId: req.userId,
          createdBy: req.userId,
          expiresAt,
          maxClicks,
          safetyStatus: safetyResult.status,
          safetyReason: safetyResult.reason
        });

        await newLink.save();
        importedCount++;
      } catch (saveErr) {
        errors.push({ row: i, message: `Database error: ${saveErr.message}` });
        skippedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalRows,
        importedCount,
        skippedCount,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
