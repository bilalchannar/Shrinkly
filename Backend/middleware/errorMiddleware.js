/**
 * Centralized Error Handling Middleware for Shrinkly
 */
const errorMiddleware = (err, req, res, next) => {
  // Log the full error to stdout/stderr
  console.error("Error caught by central handler:", err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred";
  const errorCode = err.errorCode || err.code || null;

  res.status(statusCode).json({
    success: false,
    message: message,
    errorCode: errorCode
  });
};

module.exports = errorMiddleware;
