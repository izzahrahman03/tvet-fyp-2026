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

// middleware/authMiddleware.js

exports.requireManager = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT role FROM users WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    if (rows[0].role !== 'manager')
      return res.status(403).json({ message: 'Manager access required.' });
    next();
  } catch (err) {
    console.error('requireManager error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.requireAdminOrManager = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT role FROM users WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    if (!['admin', 'manager'].includes(rows[0].role))
      return res.status(403).json({ message: 'Access denied.' });
    next();
  } catch (err) {
    console.error('requireAdminOrManager error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── Require partner role ─────────────────────────────────────
exports.requirePartner = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query('SELECT role FROM users WHERE user_id = ?', [userId]);

    if (!rows.length) return res.status(404).json({ message: 'User not found.' });

    if (rows[0].role !== 'industry_partner')
      return res.status(403).json({ message: 'Access denied. Partners only.' });

    next();
  } catch (err) {
    console.error('requirePartner error:', err);
    res.status(500).json({ message: err.message });
  }
};

