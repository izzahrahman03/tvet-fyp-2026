const db     = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const transporter = require('../config/email');

// ─── Helpers ──────────────────────────────────────────────

const generateTempPassword = () => {
  const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick   = (str, n) =>
    Array.from({ length: n }, () => str[Math.floor(Math.random() * str.length)]).join('');
  const raw = pick(upper, 3) + pick(digits, 3) + pick(lower, 3);
  return raw.split('').sort(() => Math.random() - 0.5).join('');
};

const generateToken = () => crypto.randomBytes(32).toString('hex');

// ─── Send activation email ────────────────────────────────
const sendActivationEmail = (toEmail, toName, tempPassword, activationToken, role) => {
  const activationUrl = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;

  const roleLabels = {
    applicant:           'Applicant',
    student:             'Student',
    industry_partner:    'Industry Partner',
    industry_supervisor: 'Industry Supervisor',
    admin:               'Admin',
  };
  const roleLabel = roleLabels[role] || 'User';

  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif}
  .wrapper{max-width:560px;margin:40px auto}
  .card{background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .header{background:linear-gradient(135deg,#0f172a 0%,#1a56db 100%);padding:36px 40px;text-align:center}
  .header-logo{font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px}
  .header-sub{font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px}
  .body{padding:36px 40px}
  .greeting{font-size:16px;font-weight:700;color:#1e293b;margin-bottom:12px}
  .text{font-size:14px;color:#475569;line-height:1.7;margin-bottom:20px}
  .creds-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px}
  .creds-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9}
  .creds-row:last-child{border-bottom:none}
  .creds-label{font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}
  .creds-value{font-size:14px;color:#1e293b;font-weight:700;font-family:monospace}
  .btn{display:block;background:linear-gradient(135deg,#1a56db,#3b82f6);color:white;text-decoration:none;text-align:center;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;margin:0 auto 24px}
  .warning{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;font-size:13px;color:#92400e;margin-bottom:24px}
  .footer{padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center}
  .footer-text{font-size:12px;color:#94a3b8;line-height:1.6}
</style></head><body>
<div class="wrapper"><div class="card">
  <div class="header">
    <div class="header-logo">Vitrox Academy</div>
    <div class="header-sub">Account Activation</div>
  </div>
  <div class="body">
    <p class="greeting">Hello, ${toName} 👋</p>
    <p class="text">Your <strong>${roleLabel}</strong> account has been created on Vitrox Academy. Use the credentials below to activate your account and set a permanent password.</p>
    <div class="creds-box">
      <div class="creds-row">
        <span class="creds-label">Email</span>
        <span class="creds-value">${toEmail}</span>
      </div>
      <div class="creds-row">
        <span class="creds-label">Temporary Password</span>
        <span class="creds-value">${tempPassword}</span>
      </div>
    </div>
    <a class="btn" href="${activationUrl}">Activate My Account →</a>
    <div class="warning">
      <strong>⚠ Important</strong><br/>
      This temporary password expires in <strong>24 hours</strong>. You will be asked to create a new password after activation.
    </div>
    <p style="font-size:13px;color:#94a3b8">
      If the button doesn't work, paste this into your browser:<br/>
      <a href="${activationUrl}" style="color:#1a56db;word-break:break-all">${activationUrl}</a>
    </p>
  </div>
  <div class="footer">
    <p class="footer-text">If you didn't expect this email, you can ignore it.<br/>© ${new Date().getFullYear()} Vitrox Academy. All rights reserved.</p>
  </div>
</div></div></body></html>`;

  transporter.sendMail({
    from:    `"${process.env.FROM_NAME || 'Vitrox Academy'}" <${process.env.FROM_EMAIL}>`,
    to:      toEmail,
    subject: 'Activate Your Vitrox Academy Account',
    html,
  }).catch((err) => console.error('Email send error:', err.message));
};

// ══════════════════════════════════════════════════════════
// Public self-registration
// POST /api/auth/signup
// Body: { name, email, password }
// ══════════════════════════════════════════════════════════
exports.signup = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  const hashedPassword = bcrypt.hashSync(password, 8);
  const role           = 'applicant';
  const active_status  = 'active';

  const query = 'INSERT INTO users (name, email, password, role, active_status, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
  db.query(query, [name, email, hashedPassword, role, active_status], (err) => {
    if (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ message: err.message });
    }
    res.json({ message: 'User registered successfully!' });
  });
};

// ══════════════════════════════════════════════════════════
// Admin creates a user account
// POST /api/auth/add-user
// Body: { name, email, role }
// ══════════════════════════════════════════════════════════
exports.addUserByAdmin = (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role)
    return res.status(400).json({ message: 'name, email and role are required.' });

  // 1. Check for duplicate email
  db.query('SELECT user_id FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) {
      console.error('Error checking email:', err);
      return res.status(500).json({ message: err.message });
    }
    if (rows.length > 0)
      return res.status(409).json({ message: 'A user with this email already exists.' });

    // 2. Generate temp credentials
    const tempPassword       = generateTempPassword();
    const activationToken    = generateToken();
    const hashedTempPassword = bcrypt.hashSync(tempPassword, 8);
    const tokenExpiresAt     = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 h

    // 3. Insert user as inactive
    const query = `
      INSERT INTO users
        (name, email, password, role, active_status,
         activation_token, token_expires_at, created_at)
      VALUES (?, ?, ?, ?, 'inactive', ?, ?, NOW())
    `;

    db.query(query, [name, email, hashedTempPassword, role, activationToken, tokenExpiresAt], (err) => {
      if (err) {
        console.error('Error adding user by admin:', err);
        return res.status(500).json({ message: err.message });
      }

      // 4. Send activation email (non-blocking)
      sendActivationEmail(email, name, tempPassword, activationToken, role);

      res.json({ message: `User added successfully! Activation email sent to ${email}.` });
    });
  });
};

// ══════════════════════════════════════════════════════════
// Step 1 of activation: verify token + temp password
// Returns a 15-min scoped JWT to proceed to set-password.
// POST /api/auth/verify-activation
// Body: { token, email, tempPassword }
// ══════════════════════════════════════════════════════════
exports.verifyActivation = (req, res) => {
  const { token, email, tempPassword } = req.body;

  if (!token || !email || !tempPassword)
    return res.status(400).json({ message: 'token, email, and tempPassword are required.' });

  const query = `
    SELECT user_id, name, password, token_expires_at, active_status
    FROM   users
    WHERE  activation_token = ? AND email = ?
  `;

  db.query(query, [token, email], (err, rows) => {
    if (err) {
      console.error('verifyActivation error:', err);
      return res.status(500).json({ message: err.message });
    }

    if (rows.length === 0)
      return res.status(404).json({ message: 'Invalid activation link or email address.' });

    const user = rows[0];

    if (user.active_status === 'active')
      return res.status(400).json({ message: 'This account is already activated. Please log in.' });

    if (new Date() > new Date(user.token_expires_at))
      return res.status(410).json({ message: 'Activation link has expired. Please contact the admin.' });

    const passwordMatch = bcrypt.compareSync(tempPassword, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: 'Incorrect temporary password.' });

    // Short-lived token scoped only to the set-password step
    const resetToken = jwt.sign(
      { id: user.user_id, scope: 'set-password' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ message: 'Verified. Please set your new password.', resetToken, name: user.name });
  });
};

// ══════════════════════════════════════════════════════════
// Step 2 of activation: set permanent password
// POST /api/auth/set-password
// Body: { resetToken, newPassword, confirmPassword }
// ══════════════════════════════════════════════════════════
exports.setPassword = (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (!resetToken || !newPassword || !confirmPassword)
    return res.status(400).json({ message: 'resetToken, newPassword, and confirmPassword are required.' });

  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: 'Passwords do not match.' });

  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword))
    return res.status(400).json({
      message: 'Password must be at least 8 characters with one uppercase letter and one number.',
    });

  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Session expired. Please restart activation.' });
  }

  if (payload.scope !== 'set-password')
    return res.status(403).json({ message: 'Invalid token scope.' });

  const hashedPassword = bcrypt.hashSync(newPassword, 8);

  const query = `
    UPDATE users
    SET    password         = ?,
           activation_token = NULL,
           token_expires_at = NULL,
           active_status    = 'active'
    WHERE  user_id = ? AND active_status = 'inactive'
  `;

  db.query(query, [hashedPassword, payload.id], (err, result) => {
    if (err) {
      console.error('setPassword error:', err);
      return res.status(500).json({ message: err.message });
    }

    if (result.affectedRows === 0)
      return res.status(400).json({ message: 'Account not found or already activated.' });

    res.json({ message: 'Password set successfully. You can now log in.' });
  });
};

// ══════════════════════════════════════════════════════════
// Forgot Password — generates a reset token and emails a link
// POST /api/auth/forgot-password
// Body: { email }
//
// FIX: Now fetches active_status to prevent overwriting an
// inactive user's activation token (Bug 1)
// ══════════════════════════════════════════════════════════
exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  // Always respond 200 — never reveal whether the email exists (security)
  const genericOk = () => res.json({ message: 'If that email exists, a reset link has been sent.' });

  // ✅ FIX Bug 1: fetch active_status alongside user info
  db.query('SELECT user_id, name, active_status FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) { console.error(err); return res.status(500).json({ message: err.message }); }
    if (rows.length === 0) return genericOk();

    // ✅ FIX Bug 1: block reset for unactivated accounts so their
    //    activation_token is never overwritten
    if (rows[0].active_status === 'inactive')
      return res.status(403).json({
        message: 'This account has not been activated yet. Please check your email for the activation link.',
      });

    const user           = rows[0];
    const resetToken     = generateToken();
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    db.query(
      'UPDATE users SET activation_token = ?, token_expires_at = ? WHERE user_id = ?',
      [resetToken, tokenExpiresAt, user.user_id],
      (err) => {
        if (err) { console.error(err); return res.status(500).json({ message: err.message }); }

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif}
  .wrapper{max-width:560px;margin:40px auto}
  .card{background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .header{background:linear-gradient(135deg,#0f172a 0%,#1a56db 100%);padding:36px 40px;text-align:center}
  .header-logo{font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px}
  .header-sub{font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px}
  .body{padding:36px 40px}
  .btn{display:block;background:linear-gradient(135deg,#1a56db,#3b82f6);color:white;text-decoration:none;text-align:center;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;margin:24px 0}
  .warning{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;font-size:13px;color:#92400e}
  .footer{padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8}
</style></head><body>
<div class="wrapper"><div class="card">
  <div class="header">
    <div class="header-logo">Vitrox Academy</div>
    <div class="header-sub">Password Reset Request</div>
  </div>
  <div class="body">
    <p style="font-size:16px;font-weight:700;color:#1e293b">Hello, ${user.name} 👋</p>
    <p style="font-size:14px;color:#475569;line-height:1.7">
      We received a request to reset your password. Click the button below to set a new one.
    </p>
    <a class="btn" href="${resetUrl}">Reset My Password →</a>
    <div class="warning">
      <strong>⚠ Important</strong><br/>
      This link expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
    </div>
    <p style="font-size:13px;color:#94a3b8;margin-top:20px">
      If the button doesn't work, paste this into your browser:<br/>
      <a href="${resetUrl}" style="color:#1a56db;word-break:break-all">${resetUrl}</a>
    </p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Vitrox Academy. All rights reserved.</div>
</div></div></body></html>`;

        transporter.sendMail({
          from:    `"${process.env.FROM_NAME || 'Vitrox Academy'}" <${process.env.FROM_EMAIL}>`,
          to:      email,
          subject: 'Reset Your Vitrox Academy Password',
          html,
        }).catch((err) => console.error('Reset email error:', err.message));

        genericOk();
      }
    );
  });
};

// ══════════════════════════════════════════════════════════
// Validate Reset Token — called by ResetPassword.jsx on mount
// POST /api/auth/validate-reset-token
// Body: { token }
//
// FIX: Now checks active_status to prevent activation tokens
// from being usable on the reset-password page (Bug 3)
// ══════════════════════════════════════════════════════════
exports.validateResetToken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token is required.' });

  // ✅ FIX Bug 3: fetch active_status so activation tokens
  //    (belonging to inactive users) are rejected here
  db.query(
    'SELECT user_id, token_expires_at, active_status FROM users WHERE activation_token = ?',
    [token],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (rows.length === 0) return res.status(404).json({ message: 'Invalid or expired token.' });

      // ✅ FIX Bug 3: inactive users have activation tokens, not reset tokens —
      //    return the same generic 404-style message to avoid leaking account status
      if (rows[0].active_status === 'inactive')
        return res.status(404).json({ message: 'Invalid or expired token.' });

      if (new Date() > new Date(rows[0].token_expires_at))
        return res.status(410).json({ message: 'Token has expired.' });

      res.json({ message: 'Token is valid.' });
    }
  );
};

// ══════════════════════════════════════════════════════════
// Reset Password — sets the new password
// POST /api/auth/reset-password
// Body: { token, newPassword, confirmPassword }
//
// FIX: Now also sets active_status = 'active' to ensure the
// user can always log in after a reset (Bug 2)
// ══════════════════════════════════════════════════════════
exports.resetPassword = (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword)
    return res.status(400).json({ message: 'All fields are required.' });
  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: 'Passwords do not match.' });
  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword))
    return res.status(400).json({ message: 'Password must be 8+ chars with one uppercase and one number.' });

  db.query(
    'SELECT user_id, token_expires_at, active_status FROM users WHERE activation_token = ?',
    [token],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (rows.length === 0) return res.status(404).json({ message: 'Invalid or expired token.' });

      // Guard: don't allow reset via an activation token (inactive account)
      if (rows[0].active_status === 'inactive')
        return res.status(404).json({ message: 'Invalid or expired token.' });

      if (new Date() > new Date(rows[0].token_expires_at))
        return res.status(410).json({ message: 'Token has expired. Please request a new link.' });

      const hashed = bcrypt.hashSync(newPassword, 8);

      // ✅ FIX Bug 2: also set active_status = 'active' so the user
      //    can log in even if their account was somehow deactivated
      db.query(
        `UPDATE users
         SET password         = ?,
             activation_token = NULL,
             token_expires_at = NULL,
             active_status    = 'active'
         WHERE user_id = ?`,
        [hashed, rows[0].user_id],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });
          res.json({ message: 'Password reset successfully. You can now log in.' });
        }
      );
    }
  );
};

// ══════════════════════════════════════════════════════════
// Login
// POST /api/auth/login
// Body: { email, password }
// ══════════════════════════════════════════════════════════
exports.login = (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = results[0];

    if (user.active_status === 'inactive')
      return res.status(403).json({ message: 'Account not activated. Check your email for the activation link.' });

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid)
      return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const updateLogin = 'UPDATE users SET last_login = NOW() WHERE user_id = ?';
    db.query(updateLogin, [user.user_id], (err) => {
      if (err) console.error('Error updating login status:', err);
      res.json({ message: 'Login successful', token, name: user.name, role: user.role });
    });
  });
};

// ══════════════════════════════════════════════════════════
// Deactivate inactive users — cron job
// ══════════════════════════════════════════════════════════
exports.deactivateInactiveUsers = () => {
  const query = `UPDATE users SET active_status = 'inactive' WHERE last_login < NOW() - INTERVAL 30 DAY`;
  db.query(query, (err) => {
    if (err) console.error('Error deactivating users:', err);
    else     console.log('Inactive users updated');
  });
};