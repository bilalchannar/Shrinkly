const jwt = require("jsonwebtoken");

/**
 * Generate a short-lived access JWT.
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

/**
 * Generate a long-lived refresh JWT.
 */
const generateRefreshToken = (userId) => {
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  return jwt.sign(
    { id: userId, type: "refresh" },
    secret,
    { expiresIn: "7d" }
  );
};

/**
 * Verify an access JWT.
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a refresh JWT.
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
