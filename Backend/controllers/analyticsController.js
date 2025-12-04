const Analytics = require("../models/Analytics");
const Link = require("../models/Link");
const UAParser = require("ua-parser-js");

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  let device = "unknown";
  if (result.device.type === "mobile") device = "mobile";
  else if (result.device.type === "tablet") device = "tablet";
  else if (result.os.name) device = "desktop";
  
  return {
    device,
    browser: result.browser.name || "unknown",
    os: result.os.name || "unknown"
  };
};

// Helper function to extract referrer domain
const extractReferrerDomain = (referrer) => {
  if (!referrer || referrer === "") return "direct";
  try {
    const url = new URL(referrer);
    const domain = url.hostname.replace("www.", "");
    
    // Categorize common referrers
    if (domain.includes("facebook") || domain.includes("fb.com")) return "Facebook";
    if (domain.includes("instagram")) return "Instagram";
    if (domain.includes("twitter") || domain.includes("x.com")) return "Twitter/X";
    if (domain.includes("linkedin")) return "LinkedIn";
    if (domain.includes("whatsapp")) return "WhatsApp";
    if (domain.includes("telegram")) return "Telegram";
    if (domain.includes("reddit")) return "Reddit";
    if (domain.includes("youtube")) return "YouTube";
    if (domain.includes("google")) return "Google";
    if (domain.includes("bing")) return "Bing";
    
    return domain;
  } catch {
    return "direct";
  }
};

// Record a click/visit (called when redirecting)
exports.recordClick = async (linkId, shortCode, req, isQrScan = false) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers["referer"] || req.headers["referrer"] || "";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || req.connection?.remoteAddress || "";
    
    const { device, browser, os } = parseUserAgent(userAgent);
    const referrerDomain = extractReferrerDomain(referrer);
    
    // In production, you would use a geo-IP service here
    // For now, we'll set country as unknown
    const country = "Unknown";
    const city = "Unknown";
    
    const analyticsEntry = new Analytics({
      linkId,
      shortCode,
      ip,
      userAgent,
      device,
      browser,
      os,
      country,
      city,
      referrer,
      referrerDomain,
      isQrScan,
      clickedAt: new Date()
    });
    
    await analyticsEntry.save();
    return true;
  } catch (error) {
    console.error("Error recording click:", error);
    return false;
  }
};

// Get analytics summary for a specific link
exports.getLinkAnalytics = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.clickedAt = {};
      if (startDate) dateFilter.clickedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.clickedAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    
    const link = await Link.findById(linkId);
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }
    
    const query = { linkId, ...dateFilter };
    
    // Get total clicks
    const totalClicks = await Analytics.countDocuments(query);
    
    // Get unique visitors (by IP)
    const uniqueVisitors = await Analytics.distinct("ip", query);
    
    // Get QR scans
    const qrScans = await Analytics.countDocuments({ ...query, isQrScan: true });
    
    // Get device breakdown
    const deviceStats = await Analytics.aggregate([
      { $match: query },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get browser breakdown
    const browserStats = await Analytics.aggregate([
      { $match: query },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get country breakdown
    const countryStats = await Analytics.aggregate([
      { $match: query },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get referrer breakdown
    const referrerStats = await Analytics.aggregate([
      { $match: query },
      { $group: { _id: "$referrerDomain", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get click trends (by day)
    const clickTrends = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    return res.json({
      success: true,
      analytics: {
        totalClicks,
        uniqueVisitors: uniqueVisitors.length,
        qrScans,
        deviceCount: deviceStats.length,
        countryCount: countryStats.length,
        referrerCount: referrerStats.length,
        devices: deviceStats.map(d => ({ name: d._id, clicks: d.count })),
        browsers: browserStats.map(b => ({ name: b._id, clicks: b.count })),
        countries: countryStats.map(c => ({ name: c._id, clicks: c.count })),
        referrers: referrerStats.map(r => ({ name: r._id, clicks: r.count })),
        clickTrends: clickTrends.map(t => ({ date: t._id, clicks: t.count }))
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get overall analytics for all links
exports.getOverallAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.clickedAt = {};
      if (startDate) dateFilter.clickedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.clickedAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    
    // Get total clicks
    const totalClicks = await Analytics.countDocuments(dateFilter);
    
    // Get unique visitors
    const uniqueVisitors = await Analytics.distinct("ip", dateFilter);
    
    // Get QR scans
    const qrScans = await Analytics.countDocuments({ ...dateFilter, isQrScan: true });
    
    // Get device breakdown
    const deviceStats = await Analytics.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get browser breakdown
    const browserStats = await Analytics.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get country breakdown
    const countryStats = await Analytics.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get referrer breakdown
    const referrerStats = await Analytics.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$referrerDomain", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get click trends (by day)
    const clickTrends = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    // Get top performing links
    const topLinks = await Analytics.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$linkId", clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "links",
          localField: "_id",
          foreignField: "_id",
          as: "linkDetails"
        }
      },
      { $unwind: { path: "$linkDetails", preserveNullAndEmptyArrays: true } }
    ]);
    
    return res.json({
      success: true,
      analytics: {
        totalClicks,
        uniqueVisitors: uniqueVisitors.length,
        qrScans,
        deviceCount: deviceStats.length,
        countryCount: countryStats.length,
        referrerCount: referrerStats.length,
        devices: deviceStats.map(d => ({ name: d._id, clicks: d.count })),
        browsers: browserStats.map(b => ({ name: b._id, clicks: b.count })),
        countries: countryStats.map(c => ({ name: c._id, clicks: c.count })),
        referrers: referrerStats.map(r => ({ name: r._id, clicks: r.count })),
        clickTrends: clickTrends.map(t => ({ date: t._id, clicks: t.count })),
        topLinks: topLinks.map(l => ({
          linkId: l._id,
          clicks: l.clicks,
          shortUrl: l.linkDetails ? `${l.linkDetails.domain}/${l.linkDetails.shortCode}` : "Unknown",
          originalUrl: l.linkDetails?.originalUrl || "Unknown"
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching overall analytics:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get hourly heatmap data
exports.getHeatmapData = async (req, res) => {
  try {
    const { linkId, startDate, endDate } = req.query;
    
    let query = {};
    if (linkId) query.linkId = linkId;
    if (startDate || endDate) {
      query.clickedAt = {};
      if (startDate) query.clickedAt.$gte = new Date(startDate);
      if (endDate) query.clickedAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    
    // Get clicks by day of week and hour
    const heatmapData = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$clickedAt" },
            hour: { $hour: "$clickedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.dayOfWeek": 1, "_id.hour": 1 } }
    ]);
    
    // Format for frontend
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const formattedData = heatmapData.map(d => ({
      day: days[d._id.dayOfWeek - 1],
      hour: d._id.hour,
      clicks: d.count
    }));
    
    return res.json({ success: true, heatmap: formattedData });
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get AI insights (simple analysis)
exports.getInsights = async (req, res) => {
  try {
    const { linkId } = req.query;
    
    let query = {};
    if (linkId) query.linkId = linkId;
    
    // Get best performing day
    const bestDay = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dayOfWeek: "$clickedAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    // Get best platform
    const bestPlatform = await Analytics.aggregate([
      { $match: query },
      { $group: { _id: "$referrerDomain", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    // Get best hour
    const bestHour = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $hour: "$clickedAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    // Get top link
    const topLink = await Analytics.aggregate([
      { $match: query },
      { $group: { _id: "$linkId", clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "links",
          localField: "_id",
          foreignField: "_id",
          as: "linkDetails"
        }
      },
      { $unwind: { path: "$linkDetails", preserveNullAndEmptyArrays: true } }
    ]);
    
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    return res.json({
      success: true,
      insights: {
        bestDay: bestDay[0] ? days[bestDay[0]._id - 1] : "Not enough data",
        bestPlatform: bestPlatform[0]?._id || "Not enough data",
        bestHour: bestHour[0] ? `${bestHour[0]._id}:00` : "Not enough data",
        topLink: topLink[0]?.linkDetails 
          ? `${topLink[0].linkDetails.domain}/${topLink[0].linkDetails.shortCode}`
          : "Not enough data",
        unusualPatterns: "None detected"
      }
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export analytics data
exports.exportAnalytics = async (req, res) => {
  try {
    const { linkId, startDate, endDate, format } = req.query;
    
    let query = {};
    if (linkId) query.linkId = linkId;
    if (startDate || endDate) {
      query.clickedAt = {};
      if (startDate) query.clickedAt.$gte = new Date(startDate);
      if (endDate) query.clickedAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    
    const analytics = await Analytics.find(query)
      .populate("linkId", "originalUrl shortCode domain")
      .sort({ clickedAt: -1 })
      .limit(10000);
    
    const data = analytics.map(a => ({
      shortUrl: a.linkId ? `${a.linkId.domain}/${a.linkId.shortCode}` : "Unknown",
      originalUrl: a.linkId?.originalUrl || "Unknown",
      device: a.device,
      browser: a.browser,
      os: a.os,
      country: a.country,
      referrer: a.referrerDomain,
      isQrScan: a.isQrScan,
      clickedAt: a.clickedAt.toISOString()
    }));
    
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
