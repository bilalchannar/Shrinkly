const QRCode = require("../models/QRCode");
const Link = require("../models/Link");
const crypto = require("crypto");
const mongoose = require("mongoose");

// Create a new QR code
exports.createQRCode = async (req, res) => {
  try {
    const { destinationUrl, title, qrColor, bgColor, size, createShortLink } = req.body;

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

    let linkId = null;
    let shortUrl = null;

    // Optionally create a short link for tracking
    if (createShortLink) {
      const shortCode = crypto.randomBytes(3).toString("hex");
      const newLink = new Link({
        originalUrl: destinationUrl,
        shortCode,
        userId: req.userId,
        domain: "shrinkly.link"
      });
      await newLink.save();
      linkId = newLink._id;
      shortUrl = `shrinkly.link/${shortCode}`;
    }

    const qrCode = new QRCode({
      userId: req.userId,
      linkId,
      destinationUrl,
      shortUrl,
      title: title || "",
      qrColor: qrColor || "#6f42c1",
      bgColor: bgColor || "#ffffff",
      size: size || 200
    });

    await qrCode.save();

    return res.status(201).json({
      success: true,
      message: "QR code created successfully",
      qrCode: {
        _id: qrCode._id,
        destinationUrl: qrCode.destinationUrl,
        shortUrl: qrCode.shortUrl,
        title: qrCode.title,
        qrColor: qrCode.qrColor,
        bgColor: qrCode.bgColor,
        size: qrCode.size,
        downloads: qrCode.downloads,
        scans: qrCode.scans,
        createdAt: qrCode.createdAt
      }
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
    const { search, status, sortBy } = req.query;

    let query = { userId: req.userId };

    // Search filter
    if (search) {
      query.$or = [
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
    if (sortBy === "scans") sortOptions = { scans: -1 };

    const qrCodes = await QRCode.find(query).sort(sortOptions);

    return res.json({
      success: true,
      qrCodes: qrCodes.map(qr => ({
        _id: qr._id,
        destinationUrl: qr.destinationUrl,
        shortUrl: qr.shortUrl,
        title: qr.title,
        qrColor: qr.qrColor,
        bgColor: qr.bgColor,
        size: qr.size,
        downloads: qr.downloads,
        scans: qr.scans,
        status: qr.status,
        createdAt: qr.createdAt
      }))
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
    const qrCode = await QRCode.findOne({ _id: id, userId: req.userId });

    if (!qrCode) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code not found" 
      });
    }

    return res.json({
      success: true,
      qrCode: {
        _id: qrCode._id,
        destinationUrl: qrCode.destinationUrl,
        shortUrl: qrCode.shortUrl,
        title: qrCode.title,
        qrColor: qrCode.qrColor,
        bgColor: qrCode.bgColor,
        size: qrCode.size,
        downloads: qrCode.downloads,
        scans: qrCode.scans,
        status: qrCode.status,
        createdAt: qrCode.createdAt
      }
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
    const { title, qrColor, bgColor, size, status } = req.body;

    const qrCode = await QRCode.findOne({ _id: id, userId: req.userId });
    if (!qrCode) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code not found" 
      });
    }

    // Update fields if provided
    if (title !== undefined) qrCode.title = title;
    if (qrColor) qrCode.qrColor = qrColor;
    if (bgColor) qrCode.bgColor = bgColor;
    if (size) qrCode.size = size;
    if (status) qrCode.status = status;

    await qrCode.save();

    return res.json({
      success: true,
      message: "QR code updated successfully",
      qrCode: {
        _id: qrCode._id,
        destinationUrl: qrCode.destinationUrl,
        shortUrl: qrCode.shortUrl,
        title: qrCode.title,
        qrColor: qrCode.qrColor,
        bgColor: qrCode.bgColor,
        size: qrCode.size,
        downloads: qrCode.downloads,
        scans: qrCode.scans,
        status: qrCode.status
      }
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
    const qrCode = await QRCode.findOneAndDelete({ _id: id, userId: req.userId });

    if (!qrCode) {
      return res.status(404).json({ 
        success: false, 
        message: "QR code not found" 
      });
    }

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
    const userId = req.userId;

    const totalQRCodes = await QRCode.countDocuments({ userId });
    const activeQRCodes = await QRCode.countDocuments({ userId, status: "active" });
    
    const downloadsResult = await QRCode.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$downloads" } } }
    ]);
    
    const scansResult = await QRCode.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$scans" } } }
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

    const result = await QRCode.deleteMany({ 
      _id: { $in: ids }, 
      userId: req.userId 
    });

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
