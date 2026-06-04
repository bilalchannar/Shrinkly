const QRCode = require("../models/QRCode");
const QRScan = require("../models/QRScan");
const Link = require("../models/Link");
const crypto = require("crypto");
const mongoose = require("mongoose");
const geoip = require("geoip-lite");
const { parseUserAgent, extractReferrerDomain } = require("../services/analyticsService");
const { recordScan } = require("../services/qrService");

// Create a new QR code
exports.createQRCode = async (req, res) => {
  try {
    const { destinationUrl, title, name, qrColor, bgColor, size, qrOptions, shortLinkId, linkId, createShortLink, workspaceId } = req.body;

    if (!destinationUrl) {
      return res.status(400).json({ 
        success: false, 
        message: "Destination URL is required" 
      });
    }

    // Validate URL format
    try {
      new URL(destinationUrl);
    } catch {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid URL format" 
      });
    }

    // Workspace checks
    let qrWorkspaceId = null;
    if (workspaceId && workspaceId !== "personal") {
      const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. You are not an active member of this workspace." });
      }
      if (!hasRolePermission(memberInfo.role, "editor")) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions (requires Editor role)." });
      }
      qrWorkspaceId = workspaceId;
    }

    let finalLinkId = shortLinkId || linkId || null;
    let shortUrl = null;

    // Optionally create a short link for tracking if they didn't specify one
    if (createShortLink && !finalLinkId) {
      const shortCode = crypto.randomBytes(3).toString("hex");
      const newLink = new Link({
        originalUrl: destinationUrl,
        shortCode,
        userId: req.userId,
        workspaceId: qrWorkspaceId,
        createdBy: req.userId,
        domain: "shrinkly.link"
      });
      await newLink.save();
      finalLinkId = newLink._id;
      shortUrl = `shrinkly.link/${shortCode}`;
    } else if (finalLinkId) {
      // Fetch existing short link details
      const link = await Link.findById(finalLinkId);
      if (link) {
        shortUrl = `${link.domain}/${link.shortCode}`;
      }
    }

    const qrName = name || title || "Untitled QR Code";

    const qrCode = new QRCode({
      userId: req.userId,
      linkId: finalLinkId,
      shortLinkId: finalLinkId,
      destinationUrl,
      shortUrl,
      title: qrName,
      name: qrName,
      qrColor: qrColor || qrOptions?.dotsOptions?.color || "#6f42c1",
      bgColor: bgColor || qrOptions?.backgroundOptions?.color || "#ffffff",
      size: size || qrOptions?.width || 200,
      qrOptions: qrOptions || {},
      workspaceId: qrWorkspaceId,
      createdBy: req.userId
    });

    await qrCode.save();

    return res.status(201).json({
      success: true,
      message: "QR code created successfully",
      qrCode
    });
  } catch (error) {
    console.error("Error creating QR code:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Get all QR codes for user
exports.getAllQRCodes = async (req, res) => {
  try {
    const { search, status, sortBy, workspaceId } = req.query;

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

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { destinationUrl: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Sort options
    let sortOptions = { createdAt: -1 }; // default: newest first
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "downloads") sortOptions = { downloads: -1 };
    if (sortBy === "scans" || sortBy === "scanCount") sortOptions = { scanCount: -1 };

    const qrCodes = await QRCode.find(query).sort(sortOptions);

    return res.json({
      success: true,
      qrCodes
    });
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Get single QR code by ID
exports.getQRCodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = await QRCode.findById(id);

    if (!qrCode) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code not found" 
      });
    }

    // Permission check
    if (qrCode.workspaceId) {
      const { getWorkspaceMember } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(qrCode.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
    } else {
      if (qrCode.userId && qrCode.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    return res.json({
      success: true,
      qrCode
    });
  } catch (error) {
    console.error("Error fetching QR code:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Update QR code
exports.updateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, qrColor, bgColor, size, qrOptions, status, shortLinkId, linkId, destinationUrl } = req.body;

    const qrCode = await QRCode.findById(id);
    if (!qrCode) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code not found" 
      });
    }

    // Permission check
    if (qrCode.workspaceId) {
      const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(qrCode.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      if (!hasRolePermission(memberInfo.role, "editor")) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions (requires Editor role)." });
      }
    } else {
      if (qrCode.userId && qrCode.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    const qrName = name || title;
    if (qrName !== undefined) {
      qrCode.name = qrName;
      qrCode.title = qrName;
    }
    if (destinationUrl !== undefined) qrCode.destinationUrl = destinationUrl;
    if (qrColor) qrCode.qrColor = qrColor;
    if (bgColor) qrCode.bgColor = bgColor;
    if (size) qrCode.size = size;
    if (qrOptions) qrCode.qrOptions = qrOptions;
    if (status) qrCode.status = status;

    const finalLinkId = shortLinkId || linkId;
    if (finalLinkId !== undefined) {
      qrCode.shortLinkId = finalLinkId;
      qrCode.linkId = finalLinkId;
      
      if (finalLinkId) {
        const link = await Link.findById(finalLinkId);
        if (link) {
          qrCode.shortUrl = `${link.domain}/${link.shortCode}`;
        }
      } else {
        qrCode.shortUrl = null;
      }
    }

    await qrCode.save();

    return res.json({
      success: true,
      message: "QR code updated successfully",
      qrCode
    });
  } catch (error) {
    console.error("Error updating QR code:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Delete QR code
exports.deleteQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = await QRCode.findById(id);

    if (!qrCode) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code not found" 
      });
    }

    // Permission check
    if (qrCode.workspaceId) {
      const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(qrCode.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      if (!hasRolePermission(memberInfo.role, "admin")) {
        return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions (requires Admin role)." });
      }
    } else {
      if (qrCode.userId && qrCode.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    await QRCode.findByIdAndDelete(id);

    // Delete associated scan logs
    await QRScan.deleteMany({ qrCodeId: id });

    return res.json({ 
      success: true, 
      message: "QR code deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting QR code:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Track download
exports.trackDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = await QRCode.findById(id);

    if (!qrCode) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code not found" 
      });
    }

    // Permission check
    if (qrCode.workspaceId) {
      const { getWorkspaceMember } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(qrCode.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
    } else {
      if (qrCode.userId && qrCode.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    qrCode.downloads += 1;
    await qrCode.save();

    return res.json({ 
      success: true, 
      downloads: qrCode.downloads 
    });
  } catch (error) {
    console.error("Error tracking download:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Get QR code stats
exports.getQRCodeStats = async (req, res) => {
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

    const totalQRCodes = await QRCode.countDocuments(query);
    const activeQRCodes = await QRCode.countDocuments({ ...query, status: "active" });
    
    const downloadsResult = await QRCode.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$downloads" } } }
    ]);
    
    const scansResult = await QRCode.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$scanCount" } } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalQRCodes,
        activeQRCodes,
        totalDownloads: downloadsResult[0]?.total || 0,
        totalScans: scansResult[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Error fetching QR code stats:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Bulk delete QR codes
exports.bulkDeleteQRCodes = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No QR code IDs provided" 
      });
    }

    const qrCodes = await QRCode.find({ _id: { $in: ids } });
    const { getWorkspaceMember, hasRolePermission } = require("../middleware/workspaceAuth");

    for (const qr of qrCodes) {
      if (qr.workspaceId) {
        const memberInfo = await getWorkspaceMember(qr.workspaceId, req.userId);
        if (!memberInfo || memberInfo.status !== "active") {
          return res.status(403).json({ success: false, message: "Access denied. Not an active member of the workspace for one of the QR codes." });
        }
        if (!hasRolePermission(memberInfo.role, "admin")) {
          return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions to delete some workspace QR codes (requires Admin)." });
        }
      } else {
        if (qr.userId && qr.userId.toString() !== req.userId.toString()) {
          return res.status(403).json({ success: false, message: "Access denied. You do not own some of these QR codes." });
        }
      }
    }

    const result = await QRCode.deleteMany({ _id: { $in: ids } });
    await QRScan.deleteMany({ qrCodeId: { $in: ids } });

    return res.json({
      success: true,
      message: `${result.deletedCount} QR code(s) deleted successfully`
    });
  } catch (error) {
    console.error("Error bulk deleting QR codes:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Record QR scan (GET or POST, public endpoint)
exports.recordQRScan = async (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = await QRCode.findById(id);

    if (!qrCode) {
      if (req.method === "GET") {
        return res.status(404).send("QR code not found");
      }
      return res.status(404).json({ success: false, message: "QR code not found" });
    }

    if (qrCode.status === "inactive") {
      if (req.method === "GET") {
        return res.status(403).send("This QR code is inactive");
      }
      return res.status(403).json({ success: false, message: "This QR code is inactive" });
    }

    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers["referer"] || req.headers["referrer"] || "";
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.connection?.remoteAddress || "";
    const ip = rawIp.replace(/^::ffff:/, "");

    // Record the QR scan using qrService
    await recordScan(qrCode._id, ip, userAgent, referrer);

    // Handle responses
    if (req.method === "GET") {
      return res.redirect(qrCode.destinationUrl);
    }

    return res.json({
      success: true,
      destinationUrl: qrCode.destinationUrl
    });
  } catch (error) {
    console.error("Error recording QR scan:", error);
    if (req.method === "GET") {
      return res.status(500).send("Server error");
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
