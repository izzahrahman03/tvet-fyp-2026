const db     = require('../database/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');

const { sendActivationEmail, sendPasswordResetEmail } = require('../emails/authEmail');

// ─── Helpers ──────────────────────────────────────────────

const generateTempPassword = () => {
  const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick   = (str, n) => Array.from({ length: n }, () => str[Math.floor(Math.random() * str.length)]).join('');
  const raw    = pick(upper, 3) + pick(digits, 3) + pick(lower, 3);
  return raw.split('').sort(() => Math.random() - 0.5).join('');
};

const generateToken = () => crypto.randomBytes(32).toString('hex');


// ─── Signup (self-registration) ──────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Please enter a valid email address.' });

    const hashedPassword = bcrypt.hashSync(password, 8);

    await db.query(
      'INSERT INTO users (name, email, password, role, active_status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, email, hashedPassword, 'applicant', 'active']
    );

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    // FIX: was leaking raw MySQL error e.g. "Duplicate entry '...' for key 'users.email'"
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'An account with this email already exists.' });
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ─── Verify Activation ────────────────────────────────────
exports.verifyActivation = async (req, res) => {
  try {
    const { token, email, tempPassword } = req.body;
    if (!token || !email || !tempPassword)
      return res.status(400).json({ message: 'token, email, and tempPassword are required.' });

    const [rows] = await db.query(
      'SELECT user_id, name, password, token_expires_at, active_status FROM users WHERE activation_token = ? AND email = ?',
      [token, email]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Invalid activation link or email.' });

    const user = rows[0];

    if (user.active_status === 'active')
      return res.status(400).json({ message: 'Account already activated.' });
    if (new Date() > new Date(user.token_expires_at))
      return res.status(410).json({ message: 'Activation link expired.' });
    if (!bcrypt.compareSync(tempPassword, user.password))
      return res.status(401).json({ message: 'Incorrect temporary password.' });

    const resetToken = jwt.sign(
      { id: user.user_id, scope: 'set-password' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ message: 'Verified. Please set new password.', resetToken, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ─── Set Password ────────────────────────────────────────
exports.setPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (!resetToken || !newPassword || !confirmPassword)
      return res.status(400).json({ message: 'All fields are required.' });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' });
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword))
      return res.status(400).json({ message: 'Password must be 8+ chars with one uppercase and one number.' });

    let payload;
    try { payload = jwt.verify(resetToken, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ message: 'Session expired. Please restart activation.' }); }

    if (payload.scope !== 'set-password')
      return res.status(403).json({ message: 'Invalid token scope.' });

    const hashedPassword = bcrypt.hashSync(newPassword, 8);

    const [result] = await db.query(`
      UPDATE users SET password = ?, activation_token = NULL, token_expires_at = NULL, active_status = 'active'
      WHERE user_id = ? AND active_status = 'inactive'
    `, [hashedPassword, payload.id]);

    if (result.affectedRows === 0)
      return res.status(400).json({ message: 'Account not found or already activated.' });

    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ─── Login ───────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    // FIX: use same generic message for not-found and wrong password to prevent
    // user enumeration (attacker cannot tell whether the email exists)
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const user = rows[0];

    // FIX: added 'suspended' status check alongside 'inactive'
    if (user.active_status === 'inactive')
      return res.status(403).json({ message: 'Account not activated. Check your email for the activation link.' });
    if (user.active_status === 'suspended')
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });

    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    res.json({ message: 'Login successful', token, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ─── Forgot Password ─────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query('SELECT user_id, name FROM users WHERE email = ?', [email]);

    // FIX: was returning 404 when email not found, which leaks whether an email
    // is registered (email enumeration). Always return 200 with a generic message.
    if (rows.length === 0)
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });

    const user       = rows[0];
    const resetToken = generateToken();
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      'UPDATE users SET activation_token = ?, token_expires_at = ? WHERE user_id = ?',
      [resetToken, expiresAt, user.user_id]
    );

    sendPasswordResetEmail(email, user.name, resetToken);

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ─── Validate Reset Token ────────────────────────────────
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.body;
    const [rows] = await db.query(
      'SELECT user_id, token_expires_at FROM users WHERE activation_token = ?',
      [token]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Invalid or expired reset token.' });
    if (new Date() > new Date(rows[0].token_expires_at))
      return res.status(410).json({ message: 'Reset token has expired.' });

    res.json({ message: 'Token is valid.' });
  } catch (err) {
    console.error('validateResetToken error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ─── Reset Password ──────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || !confirmPassword)
      return res.status(400).json({ message: 'All fields are required.' });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' });
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword))
      return res.status(400).json({ message: 'Password must be 8+ chars with one uppercase and one number.' });

    const [rows] = await db.query(
      'SELECT user_id, token_expires_at FROM users WHERE activation_token = ?',
      [token]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Invalid or expired reset token.' });
    if (new Date() > new Date(rows[0].token_expires_at))
      return res.status(410).json({ message: 'Reset token has expired.' });

    const hashedPassword = bcrypt.hashSync(newPassword, 8);
    await db.query(
      'UPDATE users SET password = ?, activation_token = NULL, token_expires_at = NULL WHERE user_id = ?',
      [hashedPassword, rows[0].user_id]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};