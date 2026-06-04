/**
 * A utility wrapper for async Express route handlers to automatically catch errors and pass them to the next middleware.
 * @param {Function} fn - Async express handler
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
