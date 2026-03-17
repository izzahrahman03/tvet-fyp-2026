// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db  = require('../database/db');

// ── Verify JWT token ───────────────────────────────────────
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: user_id }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// ── Require admin role ─────────────────────────────────────
exports.requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query('SELECT role FROM users WHERE user_id = ?', [userId]);

    if (!rows.length) return res.status(404).json({ message: 'User not found.' });

    if (rows[0].role !== 'admin')
      return res.status(403).json({ message: 'Access denied. Admins only.' });

    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    res.status(500).json({ message: err.message });
  }
};