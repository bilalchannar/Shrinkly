const Link = require("../models/Link");
const PasswordAttempt = require("../models/PasswordAttempt");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { validateURL } = require("../utils/urlValidator");

// Helper: escape special regex characters in user input
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: parse tags from a string or array into a clean array
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim()).filter(Boolean);
  return tags.split(",").map(t => t.trim()).filter(Boolean);
};

// Helper: format a link object for API response
const formatLink = (link, baseUrl) => {
  const protocol = baseUrl.startsWith("https") ? "https://" : "http://";
  const shortUrl = link.domain && link.domain !== "shrinkly.link"
    ? `${protocol}${link.domain}/${link.shortCode}`
    : `${baseUrl}/r/${link.shortCode}`;
  return {
    _id: link._id,
    original: link.originalUrl,
    short: shortUrl,
    shortCode: link.shortCode,
    clicks: link.clicks,
    date: link.createdAt.toISOString().split("T")[0],
    status: link.status,
    tags: link.tags,
    expiresAt: link.expiresAt || null,
    maxClicks: link.maxClicks || null,
    isPasswordProtected: !!link.password,
    domain: link.domain || "shrinkly.link",
    safetyStatus: link.safetyStatus || "safe",
    safetyReason: link.safetyReason || "",
    disabledByAdmin: !!link.disabledByAdmin
  };
};

// ======================== CREATE LINK ========================
exports.createShortLink = async (req, res) => {
  try {
    const { originalUrl, customSlug, domain, tags, expiresAt, maxClicks, password, utmParams, excludeBotTraffic, workspaceId } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ success: false, message: "URL required" });
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(originalUrl.trim());
    } catch {
      return res.status(400).json({ success: false, message: "Invalid URL format. Make sure it includes http:// or https://" });
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.status(400).json({ success: false, message: "Only HTTP and HTTPS protocols are allowed" });
    }

    // Check for prohibited schemes in path/query to prevent obfuscated scripts
    const lowerUrl = originalUrl.toLowerCase();
    if (lowerUrl.includes("javascript:") || lowerUrl.includes("data:")) {
      return res.status(400).json({ success: false, message: "Prohibited URL scheme detected" });
    }

    // Block localhost or private local IP addresses
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivateIP = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(hostname);
    if (isPrivateIP) {
      return res.status(400).json({ success: false, message: "Shortening links to local or private network domains is prohibited" });
    }

    // Security: Validate URL for malicious content
    const urlValidation = validateURL(originalUrl);
    if (!urlValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: urlValidation.message || "This URL contains prohibited content" 
      });
    }
    
    // Build final URL with UTM params if provided
    let finalUrl = originalUrl;
    const processedUtmParams = {};
    
    if (utmParams && typeof utmParams === 'object') {
      const validUtmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      const utmParts = [];
      
      for (const key of validUtmKeys) {
        if (utmParams[key]) {
          processedUtmParams[key] = utmParams[key];
          utmParts.push(`${key}=${encodeURIComponent(utmParams[key])}`);
        }
      }
      
      if (utmParts.length > 0) {
        const separator = originalUrl.includes('?') ? '&' : '?';
        finalUrl = `${originalUrl}${separator}${utmParts.join('&')}`;
      }
    }

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

    // Workspace checks
    let linkWorkspaceId = null;
    if (workspaceId && workspaceId !== "personal") {
      const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. You are not an active member of this workspace." });
      }
      if (!hasRolePermission(memberInfo.role, "editor")) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions (requires Editor role)." });
      }
      linkWorkspaceId = workspaceId;
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    // Keyword check for safetyStatus
    const detectSuspiciousKeywords = (url, slug) => {
      const keywords = ["login", "verify", "free-money", "password-reset", "gift", "crypto"];
      const textToSearch = `${url} ${slug || ""}`.toLowerCase();
      for (const keyword of keywords) {
        if (textToSearch.includes(keyword)) {
          return { suspicious: true, reason: `Contains suspicious keyword: "${keyword}"` };
        }
      }
      return { suspicious: false, reason: "" };
    };

    const keywordCheck = detectSuspiciousKeywords(finalUrl, shortCode);
    let safetyStatus = "safe";
    let safetyReason = "";
    if (keywordCheck.suspicious) {
      safetyStatus = "suspicious";
      safetyReason = keywordCheck.reason;
    }

    const newLink = new Link({
      originalUrl: finalUrl, // Use finalUrl which includes UTM params
      shortCode,
      customSlug: customSlug || null,
      domain: domain || "shrinkly.link",
      tags: parseTags(tags),
      userId: req.userId,
      workspaceId: linkWorkspaceId,
      createdBy: req.userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxClicks: maxClicks || null,
      password: hashedPassword,
      utmParams: processedUtmParams,
      excludeBotTraffic: excludeBotTraffic !== false, // Default to true
      safetyStatus,
      safetyReason
    });

    await newLink.save();

    return res.json({
      success: true,
      short: shortCode,
      shortUrl: `${baseUrl}/r/${shortCode}`,
      finalUrl: finalUrl,
      utmParams: processedUtmParams,
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
      page = 1, limit = 20,
      workspaceId
    } = req.query;

    let query = {};

    if (workspaceId && workspaceId !== "personal") {
      const { getWorkspaceMember } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      query.workspaceId = workspaceId;
    } else {
      query.userId = req.userId;
      query.workspaceId = null;
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { originalUrl: { $regex: escapedSearch, $options: "i" } },
        { shortCode: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    if (status && status !== "all") query.status = status;
    if (tag) query.tags = { $in: [new RegExp(escapeRegex(tag), "i")] };

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
    const link = await Link.findById(id);

    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    // Permission check
    if (link.workspaceId) {
      const { getWorkspaceMember } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(link.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
    } else {
      if (link.userId && link.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

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

    const link = await Link.findById(id);
    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    // Permission check
    if (link.workspaceId) {
      const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(link.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      if (!hasRolePermission(memberInfo.role, "editor")) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions (requires Editor role)." });
      }
    } else {
      if (link.userId && link.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    if (originalUrl) {
      let parsedUrl;
      try {
        parsedUrl = new URL(originalUrl.trim());
      } catch {
        return res.status(400).json({ success: false, message: "Invalid URL format. Make sure it includes http:// or https://" });
      }

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return res.status(400).json({ success: false, message: "Only HTTP and HTTPS protocols are allowed" });
      }

      const lowerUrl = originalUrl.toLowerCase();
      if (lowerUrl.includes("javascript:") || lowerUrl.includes("data:")) {
        return res.status(400).json({ success: false, message: "Prohibited URL scheme detected" });
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      const isPrivateIP = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(hostname);
      if (isPrivateIP) {
        return res.status(400).json({ success: false, message: "Shortening links to local or private network domains is prohibited" });
      }

      const urlValidation = validateURL(originalUrl);
      if (!urlValidation.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: urlValidation.message || "This URL contains prohibited content" 
        });
      }

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
    const link = await Link.findById(id);
    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    // Permission check
    if (link.workspaceId) {
      const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(link.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      if (!hasRolePermission(memberInfo.role, "admin")) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions (requires Admin role)." });
      }
    } else {
      if (link.userId && link.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    link.isDeleted = true;
    link.deletedAt = new Date();
    link.deletedBy = req.userId;
    await link.save();

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

    const links = await Link.find({ _id: { $in: ids } });
    const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");

    for (const link of links) {
      if (link.workspaceId) {
        const memberInfo = await getWorkspaceMember(link.workspaceId, req.userId);
        if (!memberInfo || memberInfo.status !== "active") {
          return res.status(403).json({ success: false, message: "Access denied. Not an active member of the workspace for one of the links." });
        }
        if (!hasRolePermission(memberInfo.role, "admin")) {
          return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions to delete some workspace links (requires Admin)." });
        }
      } else {
        if (link.userId && link.userId.toString() !== req.userId.toString()) {
          return res.status(403).json({ success: false, message: "Access denied. You do not own some of these links." });
        }
      }
    }

    const result = await Link.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.userId
        }
      }
    );
    return res.json({ success: true, message: `${result.modifiedCount} link(s) deleted successfully` });
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

    const links = await Link.find({ _id: { $in: ids } });
    const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");

    for (const link of links) {
      if (link.workspaceId) {
        const memberInfo = await getWorkspaceMember(link.workspaceId, req.userId);
        if (!memberInfo || memberInfo.status !== "active") {
          return res.status(403).json({ success: false, message: "Access denied. Not an active member of the workspace for one of the links." });
        }
        if (!hasRolePermission(memberInfo.role, "editor")) {
          return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions to update status of some workspace links (requires Editor)." });
        }
      } else {
        if (link.userId && link.userId.toString() !== req.userId.toString()) {
          return res.status(403).json({ success: false, message: "Access denied. You do not own some of these links." });
        }
      }
    }

    const result = await Link.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    return res.json({ success: true, message: `${result.modifiedCount} link(s) updated successfully` });
  } catch (err) {
    console.error("Error bulk updating links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// ======================== GET STATS ========================
exports.getLinkStats = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    let query = {};

    if (workspaceId && workspaceId !== "personal") {
      const { getWorkspaceMember } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      query.workspaceId = new mongoose.Types.ObjectId(workspaceId);
    } else {
      query.userId = new mongoose.Types.ObjectId(req.userId);
      query.workspaceId = null;
    }

    const [totalLinks, activeLinks, inactiveLinks, expiredLinks, totalClicksAgg] = await Promise.all([
      Link.countDocuments(query),
      Link.countDocuments({ ...query, status: "active" }),
      Link.countDocuments({ ...query, status: "inactive" }),
      Link.countDocuments({ ...query, status: "expired" }),
      Link.aggregate([
        { $match: { ...query, isDeleted: { $ne: true } } },
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
    const { workspaceId } = req.query;
    let query = {};

    if (workspaceId && workspaceId !== "personal") {
      const { getWorkspaceMember } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      query.workspaceId = workspaceId;
    } else {
      query.userId = req.userId;
      query.workspaceId = null;
    }

    const links = await Link.find(query).sort({ createdAt: -1 });
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
    const clientIp = req.ip || req.connection.remoteAddress;

    const link = await Link.findOne({ shortCode: code });
    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    if (!link.password) return res.json({ success: true, message: "No password required" });

    // Check for attempt tracking
    let attempt = await PasswordAttempt.findOne({
      linkCode: code,
      ipAddress: clientIp
    });

    // If locked, check if lock has expired
    if (attempt && attempt.isLocked) {
      if (new Date() < attempt.lockExpiresAt) {
        const minutesRemaining = Math.ceil((attempt.lockExpiresAt - new Date()) / 60000);
        return res.status(429).json({
          success: false,
          message: `Too many failed attempts. Try again in ${minutesRemaining} minute(s).`
        });
      } else {
        // Lock expired, reset
        attempt.isLocked = false;
        attempt.attempts = 0;
        attempt.lockExpiresAt = null;
      }
    }

    const isMatch = await bcrypt.compare(password, link.password);
    
    if (!isMatch) {
      // Increment attempts
      if (!attempt) {
        attempt = new PasswordAttempt({
          linkCode: code,
          ipAddress: clientIp,
          attempts: 1
        });
      } else {
        attempt.attempts += 1;
      }

      // Lock after 5 failed attempts for 15 minutes
      if (attempt.attempts >= 5) {
        attempt.isLocked = true;
        attempt.lockExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await attempt.save();
        return res.status(429).json({
          success: false,
          message: "Too many failed attempts. Please try again in 15 minutes."
        });
      }

      attempt.lastAttemptAt = new Date();
      await attempt.save();

      return res.status(401).json({
        success: false,
        message: "Incorrect password",
        attemptsRemaining: 5 - attempt.attempts
      });
    }

    // Password correct - reset attempts
    if (attempt) {
      await PasswordAttempt.deleteOne({ linkCode: code, ipAddress: clientIp });
    }

    return res.json({ success: true, message: "Password correct", originalUrl: link.originalUrl });
  } catch (err) {
    console.error("Error checking password:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== RESTORE LINK ========================
exports.restoreLink = async (req, res) => {
  try {
    const { id } = req.params;
    
    // We must query with isDeleted explicitly since the query middleware filters deleted links by default
    const link = await Link.findOne({ _id: id, isDeleted: true });
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found or not deleted" });
    }

    // Permission check
    if (link.workspaceId) {
      const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(link.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      if (!hasRolePermission(memberInfo.role, "editor")) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions (requires Editor role)." });
      }
    } else {
      if (link.userId && link.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    link.isDeleted = false;
    link.deletedAt = null;
    link.deletedBy = null;
    await link.save();

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    return res.json({
      success: true,
      message: "Link restored successfully",
      link: formatLink(link, baseUrl)
    });
  } catch (err) {
    console.error("Error restoring link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
