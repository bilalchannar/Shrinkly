/**
 * Format link objects for CSV export.
 * @param {Array<Object>} links - Link database objects
 * @param {string} baseUrl - Base URL for short codes
 * @returns {Array<Object>} Formatted objects for CSV export
 */
const formatLinksForCSV = (links, baseUrl) => {
  return links.map(link => ({
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
};

module.exports = { formatLinksForCSV };
