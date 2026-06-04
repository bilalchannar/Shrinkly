/**
 * Centralized Rate Limiters Configuration
 * All rate limiters for the application in one place
 */

const rateLimit = require('express-rate-limit');

// Authentication endpoints - prevent brute force attacks
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

exports.signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 signup attempts
  message: { success: false, message: 'Too many signup attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

exports.emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 email requests
  message: { success: false, message: 'Too many email requests. Please wait an hour before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset and verification - prevent abuse
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Redirect endpoint - prevent scraping and enumeration
exports.redirectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 redirects per minute per IP
  message: 'Too many redirect requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for QR code scans (they're legitimate high-volume)
    return req.query.qr === '1';
  }
});

// Password-protected link check - prevent brute force on link passwords
exports.linkPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: { success: false, message: 'Too many password attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + code combination
    return `${req.ip}:${req.params.code}`;
  }
});

// API endpoints - general rate limiting
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Contact form - prevent spam
exports.contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 contact forms per hour
  message: { success: false, message: 'Too many contact submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Developer public API - rate limiting by API Key or IP
exports.developerApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: { success: false, message: 'Too many developer API requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.apiKeyId || req.ip;
  }
});

