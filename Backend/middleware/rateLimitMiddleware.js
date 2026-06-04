const rateLimiters = require("../utils/rateLimiters");

module.exports = {
  loginLimiter: rateLimiters.loginLimiter,
  signupLimiter: rateLimiters.signupLimiter,
  emailLimiter: rateLimiters.emailLimiter,
  passwordResetLimiter: rateLimiters.passwordResetLimiter,
  redirectLimiter: rateLimiters.redirectLimiter,
  linkPasswordLimiter: rateLimiters.linkPasswordLimiter,
  apiLimiter: rateLimiters.apiLimiter,
  contactLimiter: rateLimiters.contactLimiter,
  developerApiLimiter: rateLimiters.developerApiLimiter
};
