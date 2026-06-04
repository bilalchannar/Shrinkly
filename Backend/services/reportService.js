const Link = require("../models/Link");
const Analytics = require("../models/Analytics");

/**
 * Calculate the date range for a given frequency.
 * Returns { start, end } where start is the beginning of the period.
 */
function getDateRange(frequency) {
  const now = new Date();
  const start = new Date();

  if (frequency === "daily") {
    start.setDate(start.getDate() - 1);
  } else if (frequency === "weekly") {
    start.setDate(start.getDate() - 7);
  } else if (frequency === "monthly") {
    start.setMonth(start.getMonth() - 1);
  } else {
    // Default to weekly for custom or unknown
    start.setDate(start.getDate() - 7);
  }

  return { start, end: now };
}

/**
 * Calculate the previous period date range for comparison.
 * e.g. if weekly, returns the week before last week.
 */
function getPreviousPeriodRange(frequency) {
  const { start, end } = getDateRange(frequency);
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(start.getTime() - duration);

  return { start: prevStart, end: prevEnd };
}

/**
 * Generate a full report summary for a user.
 * Queries links and analytics to produce all metrics.
 */
async function generateReportSummary(userId, frequency) {
  const { start, end } = getDateRange(frequency);
  const prevRange = getPreviousPeriodRange(frequency);

  // Get all links for this user
  const userLinks = await Link.find({ userId });
  const linkIds = userLinks.map((l) => l._id);

  // Current period analytics
  const analytics = await Analytics.find({
    linkId: { $in: linkIds },
    clickedAt: { $gte: start, $lte: end }
  });

  // Previous period analytics for comparison
  const prevAnalytics = await Analytics.find({
    linkId: { $in: linkIds },
    clickedAt: { $gte: prevRange.start, $lte: prevRange.end }
  });

  // Basic counts
  const totalLinks = userLinks.length;
  const totalClicks = analytics.length;
  const activeLinks = userLinks.filter((l) => l.status === "active").length;
  const expiredLinks = userLinks.filter((l) => l.status === "expired").length;

  // Top performing link (most clicks in period)
  const clicksByLink = {};
  analytics.forEach((a) => {
    const key = a.shortCode;
    clicksByLink[key] = (clicksByLink[key] || 0) + 1;
  });
  const topLinkEntry = Object.entries(clicksByLink).sort((a, b) => b[1] - a[1])[0];
  const topLink = topLinkEntry
    ? { shortCode: topLinkEntry[0], clicks: topLinkEntry[1] }
    : { shortCode: "N/A", clicks: 0 };

  // Top country
  const countryCounts = {};
  analytics.forEach((a) => {
    if (a.country && a.country !== "unknown") {
      countryCounts[a.country] = (countryCounts[a.country] || 0) + 1;
    }
  });
  const topCountryEntry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0];
  const topCountry = topCountryEntry
    ? { country: topCountryEntry[0], clicks: topCountryEntry[1] }
    : { country: "N/A", clicks: 0 };

  // Top city
  const cityCounts = {};
  analytics.forEach((a) => {
    if (a.city && a.city !== "unknown") {
      cityCounts[a.city] = (cityCounts[a.city] || 0) + 1;
    }
  });
  const topCityEntry = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];
  const topCity = topCityEntry
    ? { city: topCityEntry[0], clicks: topCityEntry[1] }
    : { city: "N/A", clicks: 0 };

  // Device breakdown
  const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
  analytics.forEach((a) => {
    if (a.device === "desktop") deviceBreakdown.desktop++;
    else if (a.device === "mobile") deviceBreakdown.mobile++;
    else if (a.device === "tablet") deviceBreakdown.tablet++;
  });

  // Browser breakdown
  const browserCounts = {};
  analytics.forEach((a) => {
    const b = (a.browser || "other").toLowerCase();
    browserCounts[b] = (browserCounts[b] || 0) + 1;
  });
  const knownBrowsers = ["chrome", "firefox", "safari", "edge"];
  const browserBreakdown = {
    chrome: browserCounts["chrome"] || 0,
    firefox: browserCounts["firefox"] || 0,
    safari: browserCounts["safari"] || 0,
    edge: browserCounts["edge"] || 0,
    other: Object.entries(browserCounts)
      .filter(([k]) => !knownBrowsers.includes(k))
      .reduce((sum, [, v]) => sum + v, 0)
  };

  // Referrer breakdown (top 5)
  const referrerCounts = {};
  analytics.forEach((a) => {
    const ref = a.referrerDomain || "direct";
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
  });
  const referrerBreakdown = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([referrer, clicks]) => ({ referrer, clicks }));

  // QR scans
  const qrScans = analytics.filter((a) => a.isQrScan).length;

  // Comparison with previous period
  const previousClicks = prevAnalytics.length;
  const clickChange =
    previousClicks > 0
      ? Math.round(((totalClicks - previousClicks) / previousClicks) * 100)
      : null;

  return {
    totalLinks,
    totalClicks,
    activeLinks,
    expiredLinks,
    topLink,
    topCountry,
    topCity,
    deviceBreakdown,
    browserBreakdown,
    referrerBreakdown,
    qrScans,
    comparison: {
      previousClicks,
      clickChange
    }
  };
}

const calculateNextRunAt = require("../utils/calculateNextReportRun");

module.exports = { generateReportSummary, calculateNextRunAt, getDateRange };
