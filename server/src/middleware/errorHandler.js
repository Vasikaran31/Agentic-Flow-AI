/**
 * Global error handler middleware.
 * Catches unhandled errors and returns a structured JSON response.
 */
function errorHandler(err, req, res, _next) {
  console.error('❌ Unhandled Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
