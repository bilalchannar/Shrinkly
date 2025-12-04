const Link = require("../models/Link");
const crypto = require("crypto");

// Create a new short link
exports.createShortLink = async (req, res) => {
  try {
    const { originalUrl, customSlug, domain, tags } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ success: false, message: "URL required" });
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid URL format" });
    }

    // Generate short code or use custom slug
    let shortCode = customSlug || crypto.randomBytes(3).toString("hex");

    // Check if custom slug already exists
    if (customSlug) {
      const existingLink = await Link.findOne({ shortCode: customSlug });
      if (existingLink) {
        return res.status(400).json({ success: false, message: "Custom slug already in use" });
      }
    }

    const newLink = new Link({
      originalUrl,
      shortCode,
      customSlug: customSlug || null,
      domain: domain || "shrinkly.link",
      tags: tags || ""
    });

    await newLink.save();

    return res.json({
      success: true,
      short: shortCode,
      link: {
        _id: newLink._id,
        original: newLink.originalUrl,
        short: `${newLink.domain}/${shortCode}`,
        clicks: newLink.clicks,
        date: newLink.createdAt.toISOString().split("T")[0],
        status: newLink.status,
        tags: newLink.tags
      }
    });
  } catch (err) {
    console.error("Error creating link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all links
exports.getAllLinks = async (req, res) => {
  try {
    const { search, status, sortBy, tag, minClicks, maxClicks, startDate, endDate } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: "i" } },
        { shortCode: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Tag filter
    if (tag) {
      query.tags = { $regex: tag, $options: "i" };
    }

    // Clicks range filter
    if (minClicks || maxClicks) {
      query.clicks = {};
      if (minClicks) query.clicks.$gte = parseInt(minClicks);
      if (maxClicks) query.clicks.$lte = parseInt(maxClicks);
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Sort options
    let sortOptions = { createdAt: -1 }; // default: newest first
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "clicks") sortOptions = { clicks: -1 };

    const links = await Link.find(query).sort(sortOptions);

    const formattedLinks = links.map(link => ({
      _id: link._id,
      original: link.originalUrl,
      short: `${link.domain}/${link.shortCode}`,
      shortCode: link.shortCode,
      clicks: link.clicks,
      date: link.createdAt.toISOString().split("T")[0],
      status: link.status,
      tags: link.tags
    }));

    return res.json({ success: true, links: formattedLinks });
  } catch (err) {
    console.error("Error fetching links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single link by ID
exports.getLinkById = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findById(id);

    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    return res.json({
      success: true,
      link: {
        _id: link._id,
        original: link.originalUrl,
        short: `${link.domain}/${link.shortCode}`,
        shortCode: link.shortCode,
        clicks: link.clicks,
        date: link.createdAt.toISOString().split("T")[0],
        status: link.status,
        tags: link.tags
      }
    });
  } catch (err) {
    console.error("Error fetching link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a link
exports.updateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalUrl, status, tags } = req.body;

    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    // Validate URL if provided
    if (originalUrl) {
      try {
        new URL(originalUrl);
      } catch {
        return res.status(400).json({ success: false, message: "Invalid URL format" });
      }
      link.originalUrl = originalUrl;
    }

    if (status) link.status = status;
    if (tags !== undefined) link.tags = tags;

    await link.save();

    return res.json({
      success: true,
      message: "Link updated successfully",
      link: {
        _id: link._id,
        original: link.originalUrl,
        short: `${link.domain}/${link.shortCode}`,
        shortCode: link.shortCode,
        clicks: link.clicks,
        date: link.createdAt.toISOString().split("T")[0],
        status: link.status,
        tags: link.tags
      }
    });
  } catch (err) {
    console.error("Error updating link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a link
exports.deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findByIdAndDelete(id);

    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    return res.json({ success: true, message: "Link deleted successfully" });
  } catch (err) {
    console.error("Error deleting link:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Bulk delete links
exports.bulkDeleteLinks = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No link IDs provided" });
    }

    const result = await Link.deleteMany({ _id: { $in: ids } });

    return res.json({
      success: true,
      message: `${result.deletedCount} link(s) deleted successfully`
    });
  } catch (err) {
    console.error("Error bulk deleting links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Bulk update status
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
      { _id: { $in: ids } },
      { $set: { status } }
    );

    return res.json({
      success: true,
      message: `${result.modifiedCount} link(s) updated successfully`
    });
  } catch (err) {
    console.error("Error bulk updating links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Redirect to original URL and track clicks
exports.redirectToOriginal = async (req, res) => {
  try {
    const code = req.params.code;

    const link = await Link.findOne({ shortCode: code });
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Check if link is active
    if (link.status === "inactive") {
      return res.status(403).json({ message: "This link has been deactivated" });
    }

    // Increment click count
    link.clicks += 1;
    await link.save();

    return res.redirect(link.originalUrl);
  } catch (err) {
    console.error("Error redirecting:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get link statistics
exports.getLinkStats = async (req, res) => {
  try {
    const totalLinks = await Link.countDocuments();
    const activeLinks = await Link.countDocuments({ status: "active" });
    const inactiveLinks = await Link.countDocuments({ status: "inactive" });
    const totalClicks = await Link.aggregate([
      { $group: { _id: null, total: { $sum: "$clicks" } } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalLinks,
        activeLinks,
        inactiveLinks,
        totalClicks: totalClicks[0]?.total || 0
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export links to CSV format
exports.exportLinks = async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });

    const csvData = links.map(link => ({
      originalUrl: link.originalUrl,
      shortUrl: `${link.domain}/${link.shortCode}`,
      clicks: link.clicks,
      status: link.status,
      tags: link.tags,
      createdAt: link.createdAt.toISOString().split("T")[0]
    }));

    return res.json({ success: true, data: csvData });
  } catch (err) {
    console.error("Error exporting links:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
