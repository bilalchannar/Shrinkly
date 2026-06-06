const Analytics = require("../models/Analytics");
const Link = require("../models/Link");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const { detectBot } = require("../utils/botDetector");
const { generateVisitorHash, hashIP } = require("../utils/visitorHash");

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
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.connection?.remoteAddress || "";
    
    // Strip IPv6-mapped IPv4 prefix (e.g. ::ffff:192.168.1.1 -> 192.168.1.1)
    const ip = rawIp.replace(/^::ffff:/, "");

    const { device, browser, os } = parseUserAgent(userAgent);
    const referrerDomain = extractReferrerDomain(referrer);
    
    // Bot detection
    const { isBot, botName } = detectBot(userAgent);
    
    // Visitor fingerprinting
    const visitorHash = generateVisitorHash(ip, userAgent);
    
    // Check if this visitor has clicked this link before
    const existingVisit = await Analytics.findOne({
      linkId,
      visitorHash
    });
    const isReturning = !!existingVisit;
    
    // Extract UTM parameters from request
    const utmParams = {
      utm_source: req.query.utm_source || null,
      utm_medium: req.query.utm_medium || null,
      utm_campaign: req.query.utm_campaign || null,
      utm_term: req.query.utm_term || null,
      utm_content: req.query.utm_content || null
    };
    
    // Geo-IP lookup using geoip-lite
    const geo = geoip.lookup(ip);
    const country = geo?.country || "Unknown";
    const city = geo?.city || "Unknown";
    
    // Look up the link's userId
    const linkDoc = await Link.findById(linkId).select('userId');
    
    const analyticsEntry = new Analytics({
      linkId,
      userId: linkDoc?.userId,
      shortCode,
      ipHash: hashIP(ip),
      userAgent,
      device,
      browser,
      os,
      country,
      city,
      referrer,
      referrerDomain,
      isQrScan,
      isBot,
      botName,
      visitorHash,
      isReturning,
      utmParams,
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
    const { startDate, endDate, includeBots = "true" } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.clickedAt = {};
      if (startDate) dateFilter.clickedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.clickedAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    
    // Verify link belongs to user
    const link = await Link.findOne({ _id: linkId, userId: req.userId });
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }
    
    // Filter bots if requested
    const excludeBots = includeBots === "false" || link.excludeBotTraffic;
    const query = excludeBots 
      ? { linkId, ...dateFilter, isBot: false }
      : { linkId, ...dateFilter };
    
    // Get total clicks
    const totalClicks = await Analytics.countDocuments(query);
    
    // Get total clicks including bots (for reference)
    const totalClicksIncludingBots = await Analytics.countDocuments({ linkId, ...dateFilter });
    
    // Get bot traffic stats
    const botStats = await Analytics.aggregate([
      { $match: { linkId, ...dateFilter, isBot: true } },
      { $group: { _id: "$botName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get unique visitors
    const uniqueVisitors = await Analytics.distinct("visitorHash", query);
    
    // Get returning vs new visitors
    const returningVisitors = await Analytics.countDocuments({ ...query, isReturning: true });
    const newVisitors = uniqueVisitors.length - returningVisitors;
    
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
    
    // Get UTM breakdown
    const utmSourceStats = await Analytics.aggregate([
      { $match: query },
      { $group: { _id: "$utmParams.utm_source", count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
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
        totalClicksIncludingBots,
        botTraffic: totalClicksIncludingBots - totalClicks,
        uniqueVisitors: uniqueVisitors.length,
        returningVisitors,
        newVisitors,
        conversionRate: totalClicks > 0 ? (returningVisitors / totalClicks * 100).toFixed(2) : 0,
        qrScans,
        deviceCount: deviceStats.length,
        countryCount: countryStats.length,
        referrerCount: referrerStats.length,
        devices: deviceStats.map(d => ({ name: d._id, clicks: d.count })),
        browsers: browserStats.map(b => ({ name: b._id, clicks: b.count })),
        countries: countryStats.map(c => ({ name: c._id, clicks: c.count })),
        referrers: referrerStats.map(r => ({ name: r._id, clicks: r.count })),
        utmSources: utmSourceStats.map(u => ({ source: u._id, clicks: u.count })),
        botBreakdown: botStats.map(b => ({ botName: b._id, hits: b.count })),
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
    const { startDate, endDate, includeBots = "true", workspaceId } = req.query;
    
    let linkQuery = {};
    if (workspaceId && workspaceId !== "personal") {
      const { getWorkspaceMember } = require("../middleware/workspaceAuth");
      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      linkQuery.workspaceId = workspaceId;
    } else {
      linkQuery.userId = req.userId;
      linkQuery.workspaceId = null;
    }

    // Get user's links first
    const userLinks = await Link.find(linkQuery).select("_id excludeBotTraffic");
    const userLinkIds = userLinks.map(l => l._id);
    
    if (userLinkIds.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalClicks: 0,
          uniqueVisitors: 0,
          returningVisitors: 0,
          qrScans: 0,
          deviceCount: 0,
          countryCount: 0,
          referrerCount: 0,
          botTraffic: 0,
          devices: [],
          browsers: [],
          countries: [],
          referrers: [],
          clickTrends: [],
          topLinks: [],
          botBreakdown: []
        }
      });
    }
    
    let dateFilter = { linkId: { $in: userLinkIds } };
    if (startDate || endDate) {
      dateFilter.clickedAt = {};
      if (startDate) dateFilter.clickedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.clickedAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    
    // Determine if we should filter bots (respect per-link settings)
    const shouldExcludeBots = includeBots === "false";
    const filterQuery = shouldExcludeBots ? { ...dateFilter, isBot: false } : dateFilter;
    
    // Get total clicks (with and without bots)
    const totalClicks = await Analytics.countDocuments(filterQuery);
    const totalClicksWithBots = await Analytics.countDocuments(dateFilter);
    const botTraffic = totalClicksWithBots - totalClicks;
    
    // Get unique visitors
    const uniqueVisitors = await Analytics.distinct("visitorHash", filterQuery);
    
    // Get returning visitors
    const returningStats = await Analytics.aggregate([
      { $match: filterQuery },
      { $group: { _id: "$visitorHash", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    const returningVisitors = returningStats.length;
    
    // Get QR scans
    const qrScans = await Analytics.countDocuments({ ...filterQuery, isQrScan: true });
    
    // Get bot breakdown
    const botStats = await Analytics.aggregate([
      { $match: { ...dateFilter, isBot: true } },
      { $group: { _id: "$botName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get device breakdown
    const deviceStats = await Analytics.aggregate([
      { $match: filterQuery },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get browser breakdown
    const browserStats = await Analytics.aggregate([
      { $match: filterQuery },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get country breakdown
    const countryStats = await Analytics.aggregate([
      { $match: filterQuery },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get referrer breakdown
    const referrerStats = await Analytics.aggregate([
      { $match: filterQuery },
      { $group: { _id: "$referrerDomain", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get click trends (by day)
    const clickTrends = await Analytics.aggregate([
      { $match: filterQuery },
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
      { $match: filterQuery },
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
    
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const buildShortUrl = (linkDetails) => {
      if (!linkDetails) return "Unknown";
      if (linkDetails.domain && linkDetails.domain !== "shrinkly.link") {
        return `${baseUrl.startsWith("https") ? "https://" : "http://"}${linkDetails.domain}/${linkDetails.shortCode}`;
      }
      return `${baseUrl}/r/${linkDetails.shortCode}`;
    };

    return res.json({
      success: true,
      analytics: {
        totalClicks,
        uniqueVisitors: uniqueVisitors.length,
        returningVisitors,
        qrScans,
        deviceCount: deviceStats.length,
        countryCount: countryStats.length,
        referrerCount: referrerStats.length,
        botTraffic,
        devices: deviceStats.map(d => ({ name: d._id, clicks: d.count })),
        browsers: browserStats.map(b => ({ name: b._id, clicks: b.count })),
        countries: countryStats.map(c => ({ name: c._id, clicks: c.count })),
        referrers: referrerStats.map(r => ({ name: r._id, clicks: r.count })),
        clickTrends: clickTrends.map(t => ({ date: t._id, clicks: t.count })),
        topLinks: topLinks.map(l => ({
          linkId: l._id,
          clicks: l.clicks,
          shortUrl: buildShortUrl(l.linkDetails),
          originalUrl: l.linkDetails?.originalUrl || "Unknown"
        })),
        botBreakdown: botStats.map(b => ({ name: b._id || "Unknown", clicks: b.count }))
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
    const { linkId, startDate, endDate, includeBots = "false" } = req.query;
    
    // Get user's links
    const userLinks = await Link.find({ userId: req.userId }).select("_id excludeBotTraffic");
    const userLinkIds = userLinks.map(l => l._id);
    
    let query = { linkId: { $in: userLinkIds } };
    if (linkId) {
      // Verify the specific link belongs to user
      const link = await Link.findOne({ _id: linkId, userId: req.userId });
      if (!link) {
        return res.status(404).json({ success: false, message: "Link not found" });
      }
      query.linkId = linkId;
    }
    if (startDate || endDate) {
      query.clickedAt = {};
      if (startDate) query.clickedAt.$gte = new Date(startDate);
      if (endDate) query.clickedAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    
    // Exclude bots by default (heatmap should show human activity patterns)
    if (includeBots === "false") {
      query.isBot = false;
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
    const { linkId, includeBots = "false" } = req.query;
    
    // Get user's links
    const userLinks = await Link.find({ userId: req.userId }).select("_id excludeBotTraffic");
    const userLinkIds = userLinks.map(l => l._id);
    
    let query = { linkId: { $in: userLinkIds } };
    if (linkId) {
      // Verify the specific link belongs to user
      const link = await Link.findOne({ _id: linkId, userId: req.userId });
      if (!link) {
        return res.status(404).json({ success: false, message: "Link not found" });
      }
      query.linkId = linkId;
    }
    
    // Exclude bots by default from insights
    if (includeBots === "false") {
      query.isBot = false;
    }
    
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
          ? (topLink[0].linkDetails.domain && topLink[0].linkDetails.domain !== "shrinkly.link"
              ? `${topLink[0].linkDetails.domain}/${topLink[0].linkDetails.shortCode}`
              : `${process.env.BASE_URL || "http://localhost:5000"}/r/${topLink[0].linkDetails.shortCode}`)
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
    const { linkId, startDate, endDate, format, includeBots = "false" } = req.query;
    
    // Get user's links
    const userLinks = await Link.find({ userId: req.userId }).select("_id excludeBotTraffic");
    const userLinkIds = userLinks.map(l => l._id);
    
    let query = { linkId: { $in: userLinkIds } };
    if (linkId) {
      // Verify the specific link belongs to user
      const link = await Link.findOne({ _id: linkId, userId: req.userId });
      if (!link) {
        return res.status(404).json({ success: false, message: "Link not found" });
      }
      query.linkId = linkId;
    }
    if (startDate || endDate) {
      query.clickedAt = {};
      if (startDate) query.clickedAt.$gte = new Date(startDate);
      if (endDate) query.clickedAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
    
    // Exclude bots by default from export
    if (includeBots === "false") {
      query.isBot = false;
    }
    
    const analytics = await Analytics.find(query)
      .populate("linkId", "originalUrl shortCode domain utmParams")
      .sort({ clickedAt: -1 })
      .limit(10000);
    
    const analyticsBaseUrl = process.env.BASE_URL || "http://localhost:5000";
    const data = analytics.map(a => ({
      shortUrl: a.linkId
        ? (a.linkId.domain && a.linkId.domain !== "shrinkly.link"
            ? `${analyticsBaseUrl.startsWith("https") ? "https://" : "http://"}${a.linkId.domain}/${a.linkId.shortCode}`
            : `${analyticsBaseUrl}/r/${a.linkId.shortCode}`)
        : "Unknown",
      originalUrl: a.linkId?.originalUrl || "Unknown",
      device: a.device,
      browser: a.browser,
      os: a.os,
      country: a.country,
      referrer: a.referrerDomain,
      isQrScan: a.isQrScan,
      isBot: a.isBot,
      botName: a.botName || null,
      visitorHash: a.visitorHash || null,
      isReturning: a.isReturning,
      utmSource: a.utmParams?.utm_source || null,
      utmMedium: a.utmParams?.utm_medium || null,
      utmCampaign: a.utmParams?.utm_campaign || null,
      utmTerm: a.utmParams?.utm_term || null,
      utmContent: a.utmParams?.utm_content || null,
      clickedAt: a.clickedAt.toISOString()
    }));
    
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.parseUserAgent = parseUserAgent;
exports.extractReferrerDomain = extractReferrerDomain;
