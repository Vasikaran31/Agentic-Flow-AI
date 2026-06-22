const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header and attaches user payload to req.user.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
    });
  }
}

/**
 * Role-based access control middleware.
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'operator')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions.',
      });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
