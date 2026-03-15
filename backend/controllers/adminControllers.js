// controllers/adminControllers.js

const db    = require('../database/db');
const bcrypt = require('bcryptjs');

// ══════════════════════════════════════════════════════════
// GET /api/admin/users?role=applicant&search=...
// Role-specific queries — each role has its own table source
// ══════════════════════════════════════════════════════════
exports.listUsers = (req, res) => {
  const { role, search } = req.query;

  // ── Applicants — data comes from applications + education + skills ──
  if (role === 'applicant') {
    let sql = `
      SELECT
        a.application_id  AS id,
        a.full_name,
        a.ic_number,
        a.date_of_birth,
        a.gender,
        a.race,
        a.marital_status,
        a.email,
        a.phone,
        a.street_address,
        a.city,
        a.postal_code,
        a.state,
        a.country,
        a.status,
        a.updated_at,
        ae.institute_name,
        ae.qualification,
        ae.major,
        ae.start_date,
        ae.end_date,
        ask.skill_name,
        ask.proficiency
      FROM applications a
      LEFT JOIN application_education ae  ON ae.application_id = a.application_id
      LEFT JOIN application_skills    ask ON ask.application_id = a.application_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (a.full_name LIKE ? OR a.email LIKE ? OR a.ic_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY a.updated_at DESC';

    return db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ users: rows });
    });
  }

  // ── Students / Industry Partners / Industry Supervisors ──
  // These are just rows in the users table with the matching role
  if (['student', 'industry_partner', 'industry_supervisor'].includes(role)) {
    let sql = `
      SELECT
        user_id       AS id,
        name,
        email,
        phone,
        active_status AS status,
        created_at    AS date
      FROM users
      WHERE role = ?
    `;
    const params = [role];

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    return db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ users: rows });
    });
  }

  // ── Fallback — all users (no role filter) ────────────────
  let sql = `
    SELECT
      user_id       AS id,
      name,
      email,
      role,
      active_status AS status,
      created_at    AS date
    FROM users
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (name LIKE ? OR email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ users: rows });
  });
};


// ══════════════════════════════════════════════════════════
// DELETE /api/admin/users/:id
// ══════════════════════════════════════════════════════════
exports.deleteUser = (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id)
    return res.status(400).json({ message: 'You cannot delete your own account.' });

  db.query('DELETE FROM users WHERE user_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted successfully.' });
  });
};


// ══════════════════════════════════════════════════════════
// POST /api/admin/users/import
// ══════════════════════════════════════════════════════════
exports.importUsers = (req, res) => {
  const { role, users } = req.body;

  if (!Array.isArray(users) || users.length === 0)
    return res.status(400).json({ message: 'No users provided.' });

  const crypto      = require('crypto');
  const transporter = require('../config/email');

  const results = [];
  const errors  = [];

  const processNext = (index) => {
    if (index >= users.length) {
      return res.json({
        message:  `Imported ${results.length} users. ${errors.length} failed.`,
        imported: results,
        errors,
      });
    }

    const u = users[index];
    if (!u.name || !u.email) {
      errors.push({ row: index + 1, reason: 'Missing name or email.' });
      return processNext(index + 1);
    }

    const tempPassword = crypto.randomBytes(5).toString('base64').slice(0, 9);
    const hashedPw     = require('bcryptjs').hashSync(tempPassword, 10);
    const token        = crypto.randomBytes(32).toString('hex');
    const expires      = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    db.query(
      `INSERT INTO users (name, email, password, phone, role, active_status,
         activation_token, token_expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, 'inactive', ?, ?, NOW())`,
      [u.name, u.email, hashedPw, u.phone || null, role || 'applicant', token, expires],
      (err, result) => {
        if (err) {
          errors.push({
            row:    index + 1,
            email:  u.email,
            reason: err.code === 'ER_DUP_ENTRY' ? 'Email already exists.' : err.message,
          });
          return processNext(index + 1);
        }

        const activationLink = `${process.env.FRONTEND_URL}/activate?token=${token}`;

        transporter.sendMail({
          from:    `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
          to:      u.email,
          subject: 'Activate your Vitrox Academy account',
          html: `
            <p>Hello ${u.name},</p>
            <p>Your account has been created. Use these credentials to activate it:</p>
            <p><strong>Email:</strong> ${u.email}<br/>
               <strong>Temporary Password:</strong> ${tempPassword}</p>
            <p><a href="${activationLink}">Click here to activate your account</a></p>
            <p>This link expires in 24 hours.</p>
          `,
        }).catch((e) => console.error('Email error:', u.email, e.message));

        results.push({ id: result.insertId, name: u.name, email: u.email, status: 'Pending Activation' });
        processNext(index + 1);
      }
    );
  };

  processNext(0);
};


// ══════════════════════════════════════════════════════════
// GET /api/admin/stats
// ══════════════════════════════════════════════════════════
exports.getStats = (req, res) => {
  db.query(
    `SELECT role, COUNT(*) AS count FROM users GROUP BY role`,
    (err, roleCounts) => {
      if (err) return res.status(500).json({ message: err.message });

      const totals = { applicant: 0, student: 0, industry_partner: 0, industry_supervisor: 0 };
      roleCounts.forEach(({ role, count }) => {
        if (totals.hasOwnProperty(role)) totals[role] = count;
      });

      db.query(
        `SELECT status, COUNT(*) AS count FROM applications GROUP BY status`,
        (err, statusCounts) => {
          if (err) return res.status(500).json({ message: err.message });

          const applicantByStatus = { pending: 0, under_review: 0, approved: 0, rejected: 0 };
          statusCounts.forEach(({ status, count }) => {
            if (applicantByStatus.hasOwnProperty(status)) applicantByStatus[status] = count;
          });

          db.query(
            `SELECT DATE_FORMAT(created_at, '%b') AS month,
                    MONTH(created_at)              AS month_num,
                    YEAR(created_at)               AS year,
                    role,
                    COUNT(*)                       AS count
             FROM   users
             WHERE  created_at >= DATE_SUB(NOW(), INTERVAL 8 MONTH)
             GROUP  BY year, month_num, month, role
             ORDER  BY year, month_num`,
            (err, monthlyRows) => {
              if (err) return res.status(500).json({ message: err.message });

              const map = {};
              monthlyRows.forEach(({ month, month_num, year, role, count }) => {
                const key = `${year}-${String(month_num).padStart(2, '0')}`;
                if (!map[key]) map[key] = { month, applicants: 0, students: 0, partners: 0 };
                if (role === 'applicant')        map[key].applicants += count;
                if (role === 'student')          map[key].students   += count;
                if (role === 'industry_partner') map[key].partners   += count;
              });

              res.json({
                totals,
                applicantByStatus,
                monthly: Object.values(map),
              });
            }
          );
        }
      );
    }
  );
};