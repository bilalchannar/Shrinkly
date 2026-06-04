const Conversion = require("../models/Conversion");
const ConversionPixel = require("../models/ConversionPixel");
const Link = require("../models/Link");
const { hashIP, generatePixelId } = require("../utils/visitorHash");
const { generateVisitorHash } = require("../utils/visitorHash");

// ======================== CREATE CONVERSION PIXEL ========================
exports.createConversionPixel = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { eventTypes, conversionValue, description } = req.body;

    // Verify link exists and belongs to user
    const link = await Link.findOne({ _id: linkId, userId: req.userId });
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    // Validate event types
    if (!Array.isArray(eventTypes) || eventTypes.length === 0) {
      return res.status(400).json({ success: false, message: "Event types are required" });
    }

    const validEventTypes = ["signup", "purchase", "form_submit", "download", "custom"];
    const invalidTypes = eventTypes.filter(t => !validEventTypes.includes(t));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid event types: ${invalidTypes.join(", ")}` 
      });
    }

    const pixelId = generatePixelId();
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    
    const pixel = new ConversionPixel({
      linkId,
      pixelId,
      eventTypes,
      conversionValue: conversionValue || 0,
      description: description || "",
      pixelUrl: `${baseUrl}/api/track/pixel/${pixelId}`,
      pixelScript: `<script>
(function() {
  window.ShrinklyTracker = window.ShrinklyTracker || {};
  window.ShrinklyTracker.pixelId = "${pixelId}";
  window.ShrinklyTracker.track = function(event, data) {
    fetch("${baseUrl}/api/track/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pixelId: "${pixelId}",
        event: event,
        eventData: data
      })
    });
  };
})();
</script>`
    });

    await pixel.save();

    // Add pixel to link's conversion pixels
    if (!link.conversionTracking) {
      link.conversionTracking = { enabled: false, pixels: [] };
    }
    link.conversionTracking.enabled = true;
    link.conversionTracking.pixels.push(pixel._id);
    await link.save();

    res.status(201).json({
      success: true,
      message: "Conversion pixel created",
      pixel: {
        pixelId: pixel.pixelId,
        linkId: pixel.linkId,
        eventTypes: pixel.eventTypes,
        conversionValue: pixel.conversionValue,
        pixelUrl: pixel.pixelUrl,
        pixelScript: pixel.pixelScript
      }
    });
  } catch (error) {
    console.error("Create conversion pixel error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET CONVERSION PIXELS ========================
exports.getConversionPixels = async (req, res) => {
  try {
    const { linkId } = req.params;

    // Verify link belongs to user
    const link = await Link.findOne({ _id: linkId, userId: req.userId });
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    const pixels = await ConversionPixel.find({ linkId });

    res.json({
      success: true,
      pixels: pixels.map(p => ({
        pixelId: p.pixelId,
        eventTypes: p.eventTypes,
        conversionValue: p.conversionValue,
        description: p.description,
        isActive: p.isActive,
        pixelUrl: p.pixelUrl,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error("Get conversion pixels error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== DELETE CONVERSION PIXEL ========================
exports.deleteConversionPixel = async (req, res) => {
  try {
    const { linkId, pixelId } = req.params;

    // Verify link belongs to user
    const link = await Link.findOne({ _id: linkId, userId: req.userId });
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    const pixel = await ConversionPixel.findOneAndDelete({ pixelId, linkId });
    if (!pixel) {
      return res.status(404).json({ success: false, message: "Pixel not found" });
    }

    // Remove from link's pixels
    if (link.conversionTracking && link.conversionTracking.pixels) {
      link.conversionTracking.pixels = link.conversionTracking.pixels.filter(
        p => p.toString() !== pixel._id.toString()
      );
      if (link.conversionTracking.pixels.length === 0) {
        link.conversionTracking.enabled = false;
      }
      await link.save();
    }

    res.json({ success: true, message: "Conversion pixel deleted" });
  } catch (error) {
    console.error("Delete conversion pixel error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== TRACK CONVERSION (Public Endpoint) ========================
exports.trackConversion = async (req, res) => {
  try {
    const { pixelId, event, eventData } = req.body;

    if (!pixelId || !event) {
      return res.status(400).json({ success: false, message: "pixelId and event are required" });
    }

    // Find pixel
    const pixel = await ConversionPixel.findOne({ pixelId });
    if (!pixel) {
      return res.status(404).json({ success: false, message: "Pixel not found" });
    }

    // Validate event type
    if (!pixel.eventTypes.includes(event)) {
      return res.status(400).json({ success: false, message: "Invalid event type for this pixel" });
    }

    // Get visitor info from request
    const userAgent = req.headers["user-agent"] || "";
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "";
    const ip = rawIp.replace(/^::ffff:/, "");

    const visitorHash = generateVisitorHash(ip, userAgent);
    const ipHash = hashIP(ip);

    // Create conversion record
    const conversion = new Conversion({
      linkId: pixel.linkId,
      pixelId,
      event,
      eventData: eventData || null,
      visitorHash,
      ipHash,
      userAgent,
      conversionValue: pixel.conversionValue || 0,
      timestamp: new Date()
    });

    await conversion.save();

    res.json({ success: true, message: "Conversion tracked", conversionId: conversion._id });
  } catch (error) {
    console.error("Track conversion error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== TRACK CONVERSION PIXEL (Image Endpoint) ========================
exports.trackPixel = async (req, res) => {
  try {
    const { pixelId } = req.params;
    const { event } = req.query;

    if (!pixelId) {
      // Return 1x1 transparent GIF
      const gif = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
        0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44,
        0x00, 0x3b
      ]);
      res.writeHead(200, { "Content-Type": "image/gif" });
      return res.end(gif);
    }

    // Find pixel
    const pixel = await ConversionPixel.findOne({ pixelId });
    if (!pixel) {
      // Return 1x1 transparent GIF
      const gif = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
        0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44,
        0x00, 0x3b
      ]);
      res.writeHead(200, { "Content-Type": "image/gif" });
      return res.end(gif);
    }

    // Determine event type from query param or use default
    const eventType = event || pixel.eventTypes[0];
    if (!pixel.eventTypes.includes(eventType)) {
      const gif = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
        0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44,
        0x00, 0x3b
      ]);
      res.writeHead(200, { "Content-Type": "image/gif" });
      return res.end(gif);
    }

    // Record conversion asynchronously (don't block response)
    setImmediate(() => {
      const userAgent = req.headers["user-agent"] || "";
      const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "";
      const ip = rawIp.replace(/^::ffff:/, "");

      const visitorHash = generateVisitorHash(ip, userAgent);
      const ipHash = hashIP(ip);

      const conversion = new Conversion({
        linkId: pixel.linkId,
        pixelId,
        event: eventType,
        eventData: null,
        visitorHash,
        ipHash,
        userAgent,
        conversionValue: pixel.conversionValue || 0,
        timestamp: new Date()
      });

      conversion.save().catch(err => console.error("Pixel conversion save error:", err));
    });

    // Return 1x1 transparent GIF
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
      0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44,
      0x00, 0x3b
    ]);
    
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    });
    res.end(gif);
  } catch (error) {
    console.error("Track pixel error:", error);
    // Still return GIF even on error
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
      0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44,
      0x00, 0x3b
    ]);
    res.writeHead(200, { "Content-Type": "image/gif" });
    res.end(gif);
  }
};

// ======================== GET CONVERSION ANALYTICS ========================
exports.getConversionAnalytics = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify link belongs to user
    const link = await Link.findOne({ _id: linkId, userId: req.userId });
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate + "T23:59:59.999Z");
    }

    const query = { linkId, ...dateFilter };

    // Get total conversions
    const totalConversions = await Conversion.countDocuments(query);

    // Get unique converters
    const uniqueConverters = await Conversion.distinct("visitorHash", query);

    // Get conversions by event
    const byEvent = await Conversion.aggregate([
      { $match: query },
      { $group: { _id: "$event", count: { $sum: 1 }, value: { $sum: "$conversionValue" } } },
      { $sort: { count: -1 } }
    ]);

    // Get conversions by pixel
    const byPixel = await Conversion.aggregate([
      { $match: query },
      { $group: { _id: "$pixelId", count: { $sum: 1 }, value: { $sum: "$conversionValue" } } },
      { $sort: { count: -1 } }
    ]);

    // Get conversion trends
    const conversionTrends = await Conversion.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
          value: { $sum: "$conversionValue" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate total revenue
    const totalRevenue = byEvent.reduce((sum, e) => sum + e.value, 0);

    // Get overall click count for conversion rate
    const Analytics = require("../models/Analytics");
    const totalClicks = await Analytics.countDocuments({ linkId, ...dateFilter });
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0;

    res.json({
      success: true,
      conversions: {
        totalConversions,
        uniqueConverters: uniqueConverters.length,
        conversionRate,
        totalRevenue,
        avgConversionValue: totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(2) : 0,
        byEvent: byEvent.map(e => ({
          event: e._id,
          count: e.count,
          value: e.value,
          percentage: totalConversions > 0 ? ((e.count / totalConversions) * 100).toFixed(2) : 0
        })),
        byPixel: byPixel.map(p => ({
          pixelId: p._id,
          count: p.count,
          value: p.value
        })),
        conversionTrends: conversionTrends.map(t => ({
          date: t._id,
          conversions: t.count,
          revenue: t.value
        }))
      }
    });
  } catch (error) {
    console.error("Get conversion analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
