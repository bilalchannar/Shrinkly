const crypto = require("crypto");
const Link = require("../models/Link");

/**
 * Generate a unique short code slug or verify a custom one.
 * @param {string} [customSlug] - The custom slug requested
 * @returns {Promise<string>} The unique slug
 */
const generateSlug = async (customSlug) => {
  if (customSlug) {
    const existingLink = await Link.findOne({ shortCode: customSlug });
    if (existingLink) {
      throw new Error("Custom slug already in use");
    }
    return customSlug;
  }
  return crypto.randomBytes(3).toString("hex");
};

module.exports = generateSlug;
