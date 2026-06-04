/**
 * Visitor Fingerprinting & Hashing
 * Creates a unique but privacy-respecting visitor identifier
 */

const crypto = require('crypto');

/**
 * Generate a visitor hash from IP and User Agent
 * This creates a fingerprint without storing raw identifying data
 * @param {string} ip - Client IP address
 * @param {string} userAgent - User agent string
 * @returns {string} - SHA256 hash of combined IP + User Agent
 */
exports.generateVisitorHash = (ip, userAgent) => {
  if (!ip || !userAgent) {
    return null;
  }

  const combined = `${ip}::${userAgent}`;
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex');
};

/**
 * Generate an IP hash for privacy (don't store raw IPs)
 * @param {string} ip - Client IP address
 * @returns {string} - SHA256 hash of IP
 */
exports.hashIP = (ip) => {
  if (!ip) return null;
  
  return crypto
    .createHash('sha256')
    .update(ip)
    .digest('hex');
};

/**
 * Generate a User Agent hash
 * @param {string} userAgent - User agent string
 * @returns {string} - SHA256 hash of user agent
 */
exports.hashUserAgent = (userAgent) => {
  if (!userAgent) return null;

  return crypto
    .createHash('sha256')
    .update(userAgent)
    .digest('hex');
};

/**
 * Create a pixel ID for conversion tracking
 * @returns {string} - Random 32-character hex string
 */
exports.generatePixelId = () => {
  return crypto.randomBytes(16).toString('hex');
};
