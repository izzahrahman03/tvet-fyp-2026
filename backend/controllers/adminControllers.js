// controllers/adminControllers.js

const db    = require('../database/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { sendBulkActivationEmail, sendApplicationStatusEmail } = require('../emails/adminEmail');

// Valid applicant statuses
const APPLICANT_STATUSES = [
  'pending', 'under_review', 'interview',
  'rejected_review', 'rejected_interview',
  'approved', 'accepted', 'withdraw',
];


// ══════════════════════════════════════════════════════════
// GET /api/admin/users
// ══════════════════════════════════════════════════════════
exports.listUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    // ── Applicants ──────────────────────────────────────────
    if (role === 'applicant') {
      let sql = `
        SELECT
          a.application_id AS id,
          a.name, a.ic_number, a.date_of_birth, a.gender, a.race, a.marital_status,
          a.email, a.phone, a.street_address, a.city, a.postal_code, a.state, a.country,
          a.status, a.updated_at,
          ai.interview_datetime, ai.venue, ai.interviewer_name, ai.remarks
        FROM applications a
        LEFT JOIN application_interviews ai ON ai.application_id = a.application_id
        WHERE 1=1
      `;
      const params = [];

      if (search) {
        sql += ` AND (a.name LIKE ? OR a.email LIKE ? OR a.ic_number LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      sql += ' ORDER BY a.updated_at DESC';

      const [applicants] = await db.query(sql, params);
      if (applicants.length === 0) return res.json({ users: [] });

      const appIds = applicants.map(a => a.id);

      const [educationRows] = await db.query(
        `SELECT application_id, institute_name, qualification, major, start_date, end_date
         FROM application_education WHERE application_id IN (?)`,
        [appIds]
      );
      const [skillRows] = await db.query(
        `SELECT application_id, skill_name, proficiency
         FROM application_skills WHERE application_id IN (?)`,
        [appIds]
      );

      const educationMap = {};
      const skillsMap    = {};
      educationRows.forEach(row => {
        if (!educationMap[row.application_id]) educationMap[row.application_id] = [];
        educationMap[row.application_id].push(row);
      });
      skillRows.forEach(row => {
        if (!skillsMap[row.application_id]) skillsMap[row.application_id] = [];
        skillsMap[row.application_id].push(row);
      });

      const users = applicants.map(a => ({
        ...a,
        education: educationMap[a.id] || [],
        skills:    skillsMap[a.id]    || [],
      }));

      return res.json({ users });
    }

    // ── Other roles ──────────────────────────────────────────
    if (['student', 'industry_partner', 'industry_supervisor'].includes(role)) {
      let sql;
      const params = [];

      if (role === 'industry_partner') {
        sql = `
          SELECT u.user_id AS id, u.name AS company_name, u.email, u.active_status AS status,
                 u.created_at AS date, ip.phone, ip.industry_sector, ip.location
          FROM users u
          LEFT JOIN industry_partners ip ON ip.user_id = u.user_id
          WHERE u.role = ?
        `;
        params.push(role);
        if (search) {
          sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR ip.industry_sector LIKE ? OR ip.location LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY u.created_at DESC';

      } else if (role === 'industry_supervisor') {
        sql = `
          SELECT u.user_id AS id, u.name, u.email, u.active_status AS status,
                 u.created_at AS date, isup.phone, isup.company, isup.position
          FROM users u
          LEFT JOIN industry_supervisors isup ON isup.user_id = u.user_id
          WHERE u.role = ?
        `;
        params.push(role);
        if (search) {
          sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR isup.company LIKE ? OR isup.position LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY u.created_at DESC';

      } else {
        sql = `
          SELECT user_id AS id, name, email, active_status AS status, created_at AS date
          FROM users WHERE role = ?
        `;
        params.push(role);
        if (search) {
          sql += ` AND (name LIKE ? OR email LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY created_at DESC';
      }

      const [rows] = await db.query(sql, params);
      return res.json({ users: rows });
    }

    // ── Fallback ──────────────────────────────────────────────
    let sql = `SELECT user_id AS id, name, email, role, active_status AS status, created_at AS date FROM users WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    return res.json({ users: rows });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ══════════════════════════════════════════════════════════
// UPDATE USER  PUT /api/admin/users/:id?role=
// ══════════════════════════════════════════════════════════
exports.updateUser = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id }   = req.params;
    const { role } = req.query;
    const updates  = req.body;

    // ── Applicant ──────────────────────────────────────────
    if (role === 'applicant') {

      if (updates.status && !APPLICANT_STATUSES.includes(updates.status)) {
        await conn.rollback();
        return res.status(400).json({ message: `Invalid status. Must be one of: ${APPLICANT_STATUSES.join(', ')}` });
      }

      const allowedFields = ['name', 'email', 'phone', 'status'];
      const fields        = Object.keys(updates).filter(k => allowedFields.includes(k));

      if (fields.length > 0) {
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values    = [...fields.map(f => updates[f]), id];

        const [result] = await conn.query(
          `UPDATE applications SET ${setClause}, updated_at = NOW() WHERE application_id = ?`,
          values
        );

        if (result.affectedRows === 0) {
          await conn.rollback();
          return res.status(404).json({ message: 'Applicant not found.' });
        }
      }

      // ── Interview details (only for interview status) ──
      if (updates.status === 'interview') {
        const { interview_datetime, venue, interviewer_name, remarks } = updates;

        if (!interview_datetime || !venue || !interviewer_name) {
          await conn.rollback();
          return res.status(400).json({
            message: 'Interview requires: interview_datetime, venue, and interviewer_name.'
          });
        }

        const [existing] = await conn.query(
          'SELECT id FROM application_interviews WHERE application_id = ?', [id]
        );

        if (existing.length > 0) {
          await conn.query(
            `UPDATE application_interviews
             SET interview_datetime = ?, venue = ?, interviewer_name = ?, remarks = ?, updated_at = NOW()
             WHERE application_id = ?`,
            [interview_datetime, venue, interviewer_name, remarks || null, id]
          );
        } else {
          await conn.query(
            `INSERT INTO application_interviews (application_id, interview_datetime, venue, interviewer_name, remarks)
             VALUES (?, ?, ?, ?, ?)`,
            [id, interview_datetime, venue, interviewer_name, remarks || null]
          );
        }
      }

      await conn.commit();

      const [rows] = await db.query(
        `SELECT a.application_id AS id, a.name, a.email, a.phone, a.status, a.updated_at,
                ai.interview_datetime, ai.venue, ai.interviewer_name, ai.remarks
         FROM applications a
         LEFT JOIN application_interviews ai ON ai.application_id = a.application_id
         WHERE a.application_id = ?`,
        [id]
      );

      const updatedRow = rows[0];

      // ── Send status email via adminEmail module ──
      if (updates.status) {
        sendApplicationStatusEmail(
          updatedRow.email,
          updatedRow.name,
          updates.status,
          updates.status === 'interview' ? {
            interview_datetime: updates.interview_datetime,
            venue:              updates.venue,
            interviewer_name:   updates.interviewer_name,
            remarks:            updates.remarks,
          } : null
        );
      }

      return res.json({ user: updatedRow });
    }

    // ── Other roles ────────────────────────────────────────
    const allowedFields = ['name', 'email', 'phone', 'active_status'];
    if (updates.status && !updates.active_status) updates.active_status = updates.status;
    const fields = Object.keys(updates).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values    = [...fields.map(f => updates[f]), id];

    const [result] = await conn.query(`UPDATE users SET ${setClause} WHERE user_id = ?`, values);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'User not found.' });
    }

    await conn.commit();

    const [rows] = await db.query(
      `SELECT user_id AS id, name, email, active_status AS status, created_at AS date FROM users WHERE user_id = ?`,
      [id]
    );
    return res.json({ user: rows[0] });

  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// DELETE USER  DELETE /api/admin/users/:id?role=
// ══════════════════════════════════════════════════════════
exports.deleteUser = async (req, res) => {
  try {
    const { id }   = req.params;
    const { role } = req.query;

    if (role === 'applicant') {
      const [result] = await db.query('DELETE FROM applications WHERE application_id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Applicant not found.' });
      return res.json({ message: 'Applicant deleted successfully.' });
    }

    if (parseInt(id) === req.user.id)
      return res.status(400).json({ message: 'You cannot delete your own account.' });

    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
    return res.json({ message: 'User deleted successfully.' });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ══════════════════════════════════════════════════════════
// IMPORT USERS
// ══════════════════════════════════════════════════════════
exports.importUsers = async (req, res) => {
  try {
    const { role, users } = req.body;

    if (!Array.isArray(users) || users.length === 0)
      return res.status(400).json({ message: 'No users provided.' });

    const results = [];
    const errors  = [];

    for (let i = 0; i < users.length; i++) {
      const u = users[i];

      if (!u.name || !u.email) {
        errors.push({ row: i + 1, reason: 'Missing name or email.' });
        continue;
      }

      const tempPassword = crypto.randomBytes(5).toString('base64').slice(0, 9);
      const hashedPw     = await bcrypt.hash(tempPassword, 10);
      const token        = crypto.randomBytes(32).toString('hex');
      const expires      = new Date(Date.now() + 24 * 60 * 60 * 1000);

      try {
        const [result] = await db.query(
          `INSERT INTO users (name, email, password, role, active_status,
           activation_token, token_expires_at, created_at)
           VALUES (?, ?, ?, ?, 'inactive', ?, ?, NOW())`,
          [u.name, u.email, hashedPw || null, role || 'applicant', token, expires]
        );

        const userId = result.insertId;

        if (role === 'industry_partner') {
          await db.query(
            'INSERT INTO industry_partners (user_id, phone, industry_sector, location) VALUES (?, ?, ?, ?)',
            [userId, u.phone || null, u.industry_sector || null, u.location || null]
          );
        } else if (role === 'industry_supervisor') {
          await db.query(
            'INSERT INTO industry_supervisors (user_id, phone, company, position) VALUES (?, ?, ?, ?)',
            [userId, u.phone || null, u.company || null, u.position || null]
          );
        }

        // ── Replaced inline sendMail with email module ──
        sendBulkActivationEmail(u.email, u.name, tempPassword, token, role || 'applicant');

        results.push({ id: userId, name: u.name, email: u.email });

      } catch (err) {
        errors.push({
          row:    i + 1,
          email:  u.email,
          reason: err.code === 'ER_DUP_ENTRY' ? 'Email exists' : err.message,
        });
      }
    }

    return res.json({
      message:  `Imported ${results.length} users. ${errors.length} failed.`,
      imported: results,
      errors,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ══════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════
exports.getStats = async (req, res) => {
  try {
    const [roleCounts] = await db.query(
      `SELECT role, COUNT(*) AS count FROM users GROUP BY role`
    );

    const totals = { applicant: 0, student: 0, industry_partner: 0, industry_supervisor: 0 };
    roleCounts.forEach(({ role, count }) => {
      if (Object.prototype.hasOwnProperty.call(totals, role)) totals[role] = count;
    });

    const [statusCounts] = await db.query(
      `SELECT status, COUNT(*) AS count FROM applications GROUP BY status`
    );

    const applicantByStatus = {
      pending: 0, under_review: 0, interview: 0,
      rejected_review: 0, rejected_interview: 0,
      approved: 0, accepted: 0, withdraw: 0,
    };
    statusCounts.forEach(({ status, count }) => {
      if (Object.prototype.hasOwnProperty.call(applicantByStatus, status))
        applicantByStatus[status] = count;
    });

    const [monthlyRows] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b') AS month,
             MONTH(created_at) AS month_num,
             YEAR(created_at)  AS year,
             role,
             COUNT(*) AS count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 8 MONTH)
      GROUP BY year, month_num, month, role
      ORDER BY year, month_num
    `);

    const map = {};
    monthlyRows.forEach(({ month, month_num, year, role, count }) => {
      const key = `${year}-${String(month_num).padStart(2, '0')}`;
      if (!map[key]) map[key] = { month, applicants: 0, students: 0, partners: 0 };
      if (role === 'applicant')        map[key].applicants += count;
      if (role === 'student')          map[key].students   += count;
      if (role === 'industry_partner') map[key].partners   += count;
    });

    return res.json({ totals, applicantByStatus, monthly: Object.values(map) });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN ADD USER
// ══════════════════════════════════════════════════════════
exports.addUserByAdmin = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { name, email, role, phone, industry_sector, location, company, position } = req.body;

    if (!name || !email || !role) {
      await conn.rollback();
      return res.status(400).json({ message: 'Name, Email, and Role are required.' });
    }

    if (!['industry_partner', 'industry_supervisor'].includes(role)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Role must be industry_partner or industry_supervisor.' });
    }

    const [existing] = await conn.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // ── Generate credentials for activation ──
    const tempPassword      = crypto.randomBytes(5).toString('base64').slice(0, 9);
    const hashedPassword    = await bcrypt.hash(tempPassword, 10);
    const activationToken   = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt    = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [userResult] = await conn.query(
      `INSERT INTO users
        (name, email, password, role, active_status, activation_token, token_expires_at, created_at)
       VALUES (?, ?, ?, ?, 'inactive', ?, ?, NOW())`,
      [name, email, hashedPassword, role, activationToken, tokenExpiresAt]
    );
    const userId = userResult.insertId;

    if (role === 'industry_partner') {
      await conn.query(
        'INSERT INTO industry_partners (user_id, phone, industry_sector, location) VALUES (?, ?, ?, ?)',
        [userId, phone || null, industry_sector || null, location || null]
      );
    }
    if (role === 'industry_supervisor') {
      await conn.query(
        'INSERT INTO industry_supervisors (user_id, phone, company, position) VALUES (?, ?, ?, ?)',
        [userId, phone || null, company || null, position || null]
      );
    }

    await conn.commit();

    // ── Send activation email after successful commit ──
    sendBulkActivationEmail(email, name, tempPassword, activationToken, role);

    res.json({
      message: 'User added successfully! An activation email has been sent.',
      user: {
        id: userId, company_name: name, name, email, role, status: 'inactive',
        phone: phone || null,
        ...(role === 'industry_partner'    && { industry_sector: industry_sector || null, location: location || null }),
        ...(role === 'industry_supervisor' && { company: company || null, position: position || null }),
      },
    });

  } catch (err) {
    await conn.rollback();
    console.error('AddUser error:', err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// GET /api/admin/partners
// ══════════════════════════════════════════════════════════
exports.listPartners = async (req, res) => {
  try {
    const { search } = req.query;

    let sql = `
      SELECT ip.partner_id, u.name AS company_name, ip.industry_sector, ip.location
      FROM industry_partners ip
      JOIN users u ON u.user_id = ip.user_id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      sql += ` AND (u.name LIKE ? OR ip.industry_sector LIKE ? OR ip.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY u.name ASC';

    const [rows] = await db.query(sql, params);
    return res.json({ partners: rows });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};