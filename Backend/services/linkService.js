const Link = require("../models/Link");

/**
 * Parse tags from a string or array into a clean array.
 */
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim()).filter(Boolean);
  return tags.split(",").map(t => t.trim()).filter(Boolean);
};

/**
 * Format a link object for API response.
 */
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

module.exports = {
  parseTags,
  formatLink
};
