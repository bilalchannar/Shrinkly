const { validateURL } = require("./urlValidator");

/**
 * Detect suspicious keywords inside a URL or slug.
 */
const detectSuspiciousKeywords = (url, slug) => {
  const keywords = ["login", "verify", "free-money", "password-reset", "gift", "crypto"];
  const textToSearch = `${url} ${slug || ""}`.toLowerCase();
  for (const keyword of keywords) {
    if (textToSearch.includes(keyword)) {
      return { suspicious: true, reason: `Contains suspicious keyword: "${keyword}"` };
    }
  }
  return { suspicious: false, reason: "" };
};

/**
 * Fully check if a URL is safe, suspicious, or blocked.
 */
const checkUrlSafety = (url, slug) => {
  const validation = validateURL(url);
  if (!validation.isValid) {
    return { isSafe: false, status: "blocked", reason: validation.message };
  }

  const keywordCheck = detectSuspiciousKeywords(url, slug);
  if (keywordCheck.suspicious) {
    return { isSafe: true, status: "suspicious", reason: keywordCheck.reason };
  }

  return { isSafe: true, status: "safe", reason: "" };
};

module.exports = {
  detectSuspiciousKeywords,
  checkUrlSafety
};
