const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_ecommerce_ai_2026';

// Verify JWT Token
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from DB to ensure valid and active
    const user = await db.getAsync(
      'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?',
      [decoded.user_id]
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid token or user does not exist.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
}

// Check for Admin role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Administrator privileges required.' });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin
};
