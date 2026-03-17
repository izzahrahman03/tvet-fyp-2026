// controllers/profileControllers.js
const db = require('../database/db');
const bcrypt = require('bcryptjs');

// ══════════════════════════════════════════════════════════
// GET /api/profile
// Returns the logged-in user's profile info
// ══════════════════════════════════════════════════════════
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      'SELECT user_id AS id, name, email, role, active_status, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (!rows.length) return res.status(404).json({ message: 'User not found.' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ══════════════════════════════════════════════════════════
// PUT /api/profile
// Update name and/or email
// Body: { name, email }
// ══════════════════════════════════════════════════════════
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let { name, email } = req.body;

    if (!name?.trim() || !email?.trim())
      return res.status(400).json({ message: 'Name and email are required.' });

    name = name.trim();
    email = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Invalid email address.' });

    const [existing] = await db.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      [email, userId]
    );

    if (existing.length > 0)
      return res.status(409).json({ message: 'This email is already in use by another account.' });

    const [result] = await db.query(
      'UPDATE users SET name = ?, email = ? WHERE user_id = ?',
      [name, email, userId]
    );

    if (!result.affectedRows) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'Profile updated successfully.', user: { name, email } });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ══════════════════════════════════════════════════════════
// PUT /api/profile/password
// Change password — requires current password verification
// Body: { currentPassword, newPassword, confirmPassword }
// ══════════════════════════════════════════════════════════
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ message: 'All password fields are required.' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' });

    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword))
      return res.status(400).json({
        message: 'Password must be at least 8 characters with one uppercase letter and one number.',
      });

    const [rows] = await db.query('SELECT password FROM users WHERE user_id = ?', [userId]);

    if (!rows.length) return res.status(404).json({ message: 'User not found.' });

    // Verify current password
    if (!bcrypt.compareSync(currentPassword, rows[0].password))
      return res.status(401).json({ message: 'Current password is incorrect.' });

    // Prevent reusing the same password
    if (bcrypt.compareSync(newPassword, rows[0].password))
      return res.status(400).json({ message: 'New password must be different from your current password.' });

    const hashed = bcrypt.hashSync(newPassword, 8);

    await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, userId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('updatePassword error:', err);
    res.status(500).json({ message: err.message });
  }
};