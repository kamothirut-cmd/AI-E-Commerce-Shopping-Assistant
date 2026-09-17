// Centralized Error Handling Middleware
function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err.stack || err.message);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}

// 404 Not Found Handler
function notFoundHandler(req, res, next) {
  res.status(404).json({ message: `Resource not found: ${req.originalUrl}` });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
