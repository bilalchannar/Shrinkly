const Analytics = require("../models/Analytics");
const Link = require("../models/Link");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const { detectBot } = require("../utils/botDetector");
const { generateVisitorHash, hashIP } = require("../utils/visitorHash");

// Aggregation Models
const DailyAnalytics = require("../models/DailyAnalytics");
const HourlyAnalytics = require("../models/HourlyAnalytics");
const CountryAnalytics = require("../models/CountryAnalytics");
const DeviceAnalytics = require("../models/DeviceAnalytics");

/**
 * Parse user agent to extract device, browser, and OS.
 */
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

/**
 * Categorize and extract referrer domain.
 */
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

/**
 * Record a click/visit analytics entry.
 */
const recordClick = async (linkId, shortCode, req, isQrScan = false) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers["referer"] || req.headers["referrer"] || "";
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.connection?.remoteAddress || "";
    
    // Strip IPv6-mapped IPv4 prefix
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
    
    // Geo-IP lookup
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

    // Asynchronously update pre-aggregations (non-blocking)
    updateAggregations({
      userId: linkDoc?.userId,
      linkId,
      clickedAt: analyticsEntry.clickedAt,
      isQrScan,
      device,
      country,
      isReturning
    }).catch((err) => console.error("Error updating aggregations:", err));

    return true;
  } catch (error) {
    console.error("Error recording click in service:", error);
    return false;
  }
};

/**
 * Helper to update Daily, Hourly, Country, and Device pre-aggregation records.
 */
const updateAggregations = async ({ userId, linkId, clickedAt, isQrScan, device, country, isReturning }) => {
  const startOfDay = new Date(clickedAt);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const startOfHour = new Date(clickedAt);
  startOfHour.setUTCMinutes(0, 0, 0);

  const incData = {
    clicks: 1,
    uniqueVisitors: isReturning ? 0 : 1,
    qrScans: isQrScan ? 1 : 0
  };

  // Daily Aggregation
  await DailyAnalytics.findOneAndUpdate(
    { linkId, date: startOfDay },
    { 
      $setOnInsert: { userId },
      $inc: incData
    },
    { upsert: true }
  );

  // Hourly Aggregation
  await HourlyAnalytics.findOneAndUpdate(
    { linkId, hour: startOfHour },
    { 
      $setOnInsert: { userId },
      $inc: incData
    },
    { upsert: true }
  );

  // Country Aggregation
  await CountryAnalytics.findOneAndUpdate(
    { linkId, date: startOfDay, country: country || "unknown" },
    { 
      $setOnInsert: { userId },
      $inc: incData
    },
    { upsert: true }
  );

  // Device Aggregation
  await DeviceAnalytics.findOneAndUpdate(
    { linkId, date: startOfDay, device: device || "unknown" },
    { 
      $setOnInsert: { userId },
      $inc: incData
    },
    { upsert: true }
  );
};

module.exports = {
  parseUserAgent,
  extractReferrerDomain,
  recordClick
};
