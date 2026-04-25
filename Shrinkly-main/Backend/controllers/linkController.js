const Link = require("../models/Link");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Helper: parse tags from a string or array into a clean array
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim()).filter(Boolean);
  return tags.split(",").map(t => t.trim()).filter(Boolean);
};

// Helper: format a link object for API response
const formatLink = (link, baseUrl) => ({
  _id: link._id,
  original: link.originalUrl,
  short: `${baseUrl}/r/${link.shortCode}`,
  shortCode: link.shortCode,
  clicks: link.clicks,
  date: link.createdAt.toISOString().split("T")[0],
  status: link.status,
  tags: link.tags,
  expiresAt: link.expiresAt || null,
  maxClicks: link.maxClicks || null,
  isPasswordProtected: !!link.password
});

// ======================== CREATE LINK ========================
exports.createShortLink = async (req, res) => {
  try {
    const { originalUrl, customSlug, domain, tags, expiresAt, maxClicks, password } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ success: false, message: "URL required" });
    }

    try { new URL(originalUrl); }
    catch { return res.status(400).json({ success: false, message: "Invalid URL format" }); }

    let shortCode = customSlug || crypto.randomBytes(3).toString("hex");

    if (customSlug) {
      const existingLink = await Link.findOne({ shortCode: customSlug });
      if (existingLink) {
        return res.status(400).json({ success: false, message: "Custom slug already in use" });
      }
    }

    // Validate expiresAt
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return res.status(400).json({ success: false, message: "Expiry date must be in the future" });
    }

    // Validate maxClicks
    if (maxClicks !== undefined && maxClicks !== null && (isNaN(maxClicks) || maxClicks < 1)) {
      return res.status(400).json({ success: false, message: "Max clicks must be a positive number" });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    const newLink = new Link({
      originalUrl,
      shortCode,
      customSlug: customSlug || null,
      domain: domain || "shrinkly.link",
      tags: parseTags(tags),
      userId: req.userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxClicks: maxClicks || null,
      password: hashedPassword
    });

    await newLink.save();

    return res.json({
      success: true,
      short: shortCode,
      shortUrl: `${baseUrl}/r/${shortCode}`,
      link: formatLink(newLink, baseUrl)
    });
  } catch (err) {
    console.error("Error creating link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET ALL LINKS (with pagination) ========================
exports.getAllLinks = async (req, res) => {
  try {
    const {
      search, status, sortBy, tag,
      minClicks, maxClicks: maxClicksFilter,
      startDate, endDate,
      page = 1, limit = 20
    } = req.query;

    let query = { userId: req.userId };

    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: "i" } },
        { shortCode: { $regex: search, $options: "i" } }
      ];
      query.userId = req.userId;
    }

    if (status && status !== "all") query.status = status;
    if (tag) query.tags = { $in: [new RegExp(tag, "i")] };

    if (minClicks || maxClicksFilter) {
      query.clicks = {};
      if (minClicks) query.clicks.$gte = parseInt(minClicks);
      if (maxClicksFilter) query.clicks.$lte = parseInt(maxClicksFilter);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "clicks") sortOptions = { clicks: -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [links, total] = await Promise.all([
      Link.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Link.countDocuments(query)
    ]);

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const formattedLinks = links.map(link => formatLink(link, baseUrl));

    return res.json({
      success: true,
      links: formattedLinks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    console.error("Error fetching links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET SINGLE LINK ========================
exports.getLinkById = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findOne({ _id: id, userId: req.userId });

    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    return res.json({ success: true, link: formatLink(link, baseUrl) });
  } catch (err) {
    console.error("Error fetching link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== UPDATE LINK ========================
exports.updateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalUrl, status, tags, expiresAt, maxClicks, password } = req.body;

    const link = await Link.findOne({ _id: id, userId: req.userId });
    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    if (originalUrl) {
      try { new URL(originalUrl); }
      catch { return res.status(400).json({ success: false, message: "Invalid URL format" }); }
      link.originalUrl = originalUrl;
    }

    if (status) link.status = status;
    if (tags !== undefined) link.tags = parseTags(tags);
    if (expiresAt !== undefined) link.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (maxClicks !== undefined) link.maxClicks = maxClicks || null;

    // Update password: empty string = remove password
    if (password !== undefined) {
      link.password = password ? await bcrypt.hash(password, 10) : null;
    }

    await link.save();

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    return res.json({
      success: true,
      message: "Link updated successfully",
      link: formatLink(link, baseUrl)
    });
  } catch (err) {
    console.error("Error updating link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== DELETE LINK ========================
exports.deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findOneAndDelete({ _id: id, userId: req.userId });
    if (!link) return res.status(404).json({ success: false, message: "Link not found" });
    return res.json({ success: true, message: "Link deleted successfully" });
  } catch (err) {
    console.error("Error deleting link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== BULK DELETE ========================
exports.bulkDeleteLinks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No link IDs provided" });
    }
    const result = await Link.deleteMany({ _id: { $in: ids }, userId: req.userId });
    return res.json({ success: true, message: `${result.deletedCount} link(s) deleted successfully` });
  } catch (err) {
    console.error("Error bulk deleting links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== BULK UPDATE STATUS ========================
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No link IDs provided" });
    }
    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const result = await Link.updateMany(
      { _id: { $in: ids }, userId: req.userId },
      { $set: { status } }
    );
    return res.json({ success: true, message: `${result.modifiedCount} link(s) updated successfully` });
  } catch (err) {
    console.error("Error bulk updating links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== REDIRECT (with expiry + click limit + password check) ========================
exports.redirectToOriginal = async (req, res) => {
  try {
    const code = req.params.code;
    const link = await Link.findOne({ shortCode: code });

    if (!link) return res.status(404).json({ message: "Link not found" });
    if (link.status === "inactive") return res.status(403).json({ message: "This link has been deactivated" });

    // Check expiry
    if (link.expiresAt && new Date() > link.expiresAt) {
      link.status = "expired";
      await link.save();
      return res.status(410).json({ message: "This link has expired" });
    }

    // Check click limit
    if (link.maxClicks && link.clicks >= link.maxClicks) {
      link.status = "inactive";
      await link.save();
      return res.status(403).json({ message: "This link has reached its maximum click limit" });
    }

    // Password-protected link
    if (link.password) {
      const providedPassword = req.query.pw;
      if (!providedPassword) {
        return res.status(401).json({ requiresPassword: true, shortCode: code });
      }
      const isMatch = await bcrypt.compare(providedPassword, link.password);
      if (!isMatch) {
        return res.status(401).json({ requiresPassword: true, wrongPassword: true, shortCode: code });
      }
    }

    link.clicks += 1;
    await link.save();

    return res.redirect(link.originalUrl);
  } catch (err) {
    console.error("Error redirecting:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ======================== GET STATS ========================
exports.getLinkStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const [totalLinks, activeLinks, inactiveLinks, expiredLinks, totalClicksAgg] = await Promise.all([
      Link.countDocuments({ userId: req.userId }),
      Link.countDocuments({ userId: req.userId, status: "active" }),
      Link.countDocuments({ userId: req.userId, status: "inactive" }),
      Link.countDocuments({ userId: req.userId, status: "expired" }),
      Link.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: "$clicks" } } }
      ])
    ]);

    return res.json({
      success: true,
      stats: {
        totalLinks,
        activeLinks,
        inactiveLinks,
        expiredLinks,
        totalClicks: totalClicksAgg[0]?.total || 0
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== EXPORT CSV ========================
exports.exportLinks = async (req, res) => {
  try {
    const links = await Link.find({ userId: req.userId }).sort({ createdAt: -1 });
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const csvData = links.map(link => ({
      originalUrl: link.originalUrl,
      shortUrl: `${baseUrl}/r/${link.shortCode}`,
      clicks: link.clicks,
      status: link.status,
      tags: link.tags.join(", "),
      expiresAt: link.expiresAt ? link.expiresAt.toISOString().split("T")[0] : "",
      maxClicks: link.maxClicks || "",
      passwordProtected: !!link.password,
      createdAt: link.createdAt.toISOString().split("T")[0]
    }));
    return res.json({ success: true, data: csvData });
  } catch (err) {
    console.error("Error exporting links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== CHECK PASSWORD FOR LINK ========================
exports.checkLinkPassword = async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.body;

    const link = await Link.findOne({ shortCode: code });
    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    if (!link.password) return res.json({ success: true, message: "No password required" });

    const isMatch = await bcrypt.compare(password, link.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect password" });

    return res.json({ success: true, message: "Password correct", originalUrl: link.originalUrl });
  } catch (err) {
    console.error("Error checking password:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
