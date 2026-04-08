// controllers/adminControllers.js

const db    = require('../database/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { sendBulkActivationEmail } = require('../emails/adminEmail');

// ══════════════════════════════════════════════════════════
// GET /api/admin/users
// ══════════════════════════════════════════════════════════
exports.listUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    // ── Applicants ───────────────────────────────────────────
    if (role === 'applicant') {
      let sql = `
        SELECT
          u.user_id AS id, u.name, u.email, u.active_status AS status, u.created_at AS date,
          a.application_id,
          a.status        AS application_status,
          a.updated_at    AS application_updated_at
        FROM users u
        LEFT JOIN applications a ON a.user_id = u.user_id
        WHERE u.role = 'applicant'
      `;
      const params = [];
      if (search) {
        sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      sql += ' ORDER BY u.created_at DESC';

      const [rows] = await db.query(sql, params);
      return res.json({ users: rows });
    }

    // ── Other roles ──────────────────────────────────────────
    if (['student', 'industry_partner', 'industry_supervisor', 'manager'].includes(role)) {
      let sql;
      const params = [];

      if (role === 'industry_partner') {
        // users.name / users.email = contact person
        // industry_partners.company_name = company
        // industry_partners.contact_person_phone = phone
        sql = `
          SELECT
            u.user_id AS id,
            COALESCE(ip.company_name, u.name) AS company_name,
            u.name    AS contact_person_name,
            u.email,
            u.active_status AS status,
            u.created_at    AS date,
            ip.contact_person_phone AS phone,
            ip.industry_sector,
            ip.location
          FROM users u
          LEFT JOIN industry_partners ip ON ip.user_id = u.user_id
          WHERE u.role = ?
        `;
        params.push(role);
        if (search) {
          sql += ` AND (ip.company_name LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR ip.industry_sector LIKE ? OR ip.location LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY u.created_at DESC';

      } else if (role === 'industry_supervisor') {
        // isup no longer has a `company` column — inherit from industry_partners via partner_id
        sql = `
          SELECT
            u.user_id AS id,
            u.name,
            u.email,
            u.active_status AS status,
            u.created_at    AS date,
            isup.phone,
            isup.position,
            isup.partner_id,
            COALESCE(ip.company_name, '') AS company
          FROM users u
          LEFT JOIN industry_supervisors isup ON isup.user_id = u.user_id
          LEFT JOIN industry_partners   ip   ON ip.partner_id = isup.partner_id
          WHERE u.role = ?
        `;
        params.push(role);
        if (search) {
          sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR ip.company_name LIKE ? OR isup.position LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY u.created_at DESC';

      } else if (role === 'student') {
        sql = `
          SELECT
            u.user_id       AS id,
            u.name, u.email,
            u.active_status AS status,
            u.created_at    AS date,
            s.matric_number,
            a.phone,
            i.intake_name
          FROM users u
          LEFT JOIN students     s ON s.user_id        = u.user_id
          LEFT JOIN applications a ON a.application_id = s.application_id
          LEFT JOIN intakes      i ON i.intake_id      = s.intake_id
          WHERE u.role = ?
        `;
        params.push(role);
        if (search) {
          sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR s.matric_number LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY u.created_at DESC';

      } else if (role === 'manager') {
        sql = `
          SELECT
            u.user_id    AS id,
            u.name,
            u.email,
            u.active_status AS status,
            u.created_at    AS date,
            m.phone
          FROM users u
          LEFT JOIN managers m ON m.user_id = u.user_id
          WHERE u.role = 'manager'
        `;
        if (search) {
          sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
          params.push(`%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY u.created_at DESC';
      }
      else {
        sql = `SELECT user_id AS id, name, email, active_status AS status, created_at AS date FROM users WHERE role = ?`;
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
    console.error('listUsers error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
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

    const allowedUserFields = ['name', 'email', 'active_status'];
    if (updates.status && !updates.active_status) updates.active_status = updates.status;

    const userFields = Object.keys(updates).filter(k => allowedUserFields.includes(k));

    // Determine whether there are any role-specific table updates
    const hasPartnerUpdates    = role === 'industry_partner'    &&
      (updates.phone !== undefined || updates.company_name !== undefined ||
       updates.industry_sector !== undefined || updates.location !== undefined);
    const hasSupervisorUpdates = role === 'industry_supervisor' &&
      (updates.phone !== undefined || updates.position !== undefined || updates.partner_id !== undefined);
    const hasManagerUpdates    = role === 'manager' && updates.phone !== undefined;

    if (userFields.length === 0 && !hasPartnerUpdates && !hasSupervisorUpdates && !hasManagerUpdates) {
      await conn.rollback();
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    // ── Update users table ─────────────────────────────────
    if (userFields.length > 0) {
      const setClause = userFields.map(f => `${f} = ?`).join(', ');
      const values    = [...userFields.map(f => updates[f]), id];
      const [result]  = await conn.query(`UPDATE users SET ${setClause} WHERE user_id = ?`, values);

      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'User not found.' });
      }
    }

    // ── Update role-specific table ─────────────────────────
    if (role === 'industry_partner') {
      const partnerFields = {};
      if (updates.phone            !== undefined) partnerFields.contact_person_phone = updates.phone;
      if (updates.company_name     !== undefined) partnerFields.company_name         = updates.company_name;
      if (updates.industry_sector  !== undefined) partnerFields.industry_sector      = updates.industry_sector;
      if (updates.location         !== undefined) partnerFields.location             = updates.location;

      if (Object.keys(partnerFields).length > 0) {
        const setClause = Object.keys(partnerFields).map(f => `${f} = ?`).join(', ');
        const values    = [...Object.values(partnerFields), id];
        await conn.query(`UPDATE industry_partners SET ${setClause} WHERE user_id = ?`, values);
      }

    } else if (role === 'industry_supervisor') {
      const supFields = {};
      if (updates.phone      !== undefined) supFields.phone      = updates.phone;
      if (updates.position   !== undefined) supFields.position   = updates.position;
      if (updates.partner_id !== undefined) supFields.partner_id = updates.partner_id || null;

      if (Object.keys(supFields).length > 0) {
        const setClause = Object.keys(supFields).map(f => `${f} = ?`).join(', ');
        const values    = [...Object.values(supFields), id];
        await conn.query(`UPDATE industry_supervisors SET ${setClause} WHERE user_id = ?`, values);
      }
    }

    await conn.commit();

    // ── Return updated row (role-aware) ────────────────────
    let returnRow;

    if (role === 'industry_partner') {
      const [rows] = await db.query(
        `SELECT
           u.user_id AS id,
           COALESCE(ip.company_name, u.name) AS company_name,
           u.name    AS contact_person_name,
           u.email,
           u.active_status AS status,
           u.created_at    AS date,
           ip.contact_person_phone AS phone,
           ip.industry_sector,
           ip.location
         FROM users u
         LEFT JOIN industry_partners ip ON ip.user_id = u.user_id
         WHERE u.user_id = ?`,
        [id]
      );
      returnRow = rows[0];

    } else if (role === 'industry_supervisor') {
      const [rows] = await db.query(
        `SELECT
           u.user_id AS id,
           u.name,
           u.email,
           u.active_status AS status,
           u.created_at    AS date,
           isup.phone,
           isup.position,
           isup.partner_id,
           COALESCE(ip.company_name, '') AS company
         FROM users u
         LEFT JOIN industry_supervisors isup ON isup.user_id = u.user_id
         LEFT JOIN industry_partners   ip   ON ip.partner_id = isup.partner_id
         WHERE u.user_id = ?`,
        [id]
      );
      returnRow = rows[0];

    } else if (role === 'manager') {
      // Also update managers.phone if provided
      if (updates.phone !== undefined) {
        await conn.query(
          `UPDATE managers SET phone = ? WHERE user_id = ?`,
          [updates.phone || null, id]
        );
      }
      const [rows] = await db.query(
        `SELECT u.user_id AS id, u.name, u.email, u.active_status AS status,
                u.created_at AS date, m.phone
         FROM users u
         LEFT JOIN managers m ON m.user_id = u.user_id
         WHERE u.user_id = ?`,
        [id]
      );
      returnRow = rows[0];

    } else {
      const [rows] = await db.query(
        `SELECT user_id AS id, name, email, active_status AS status, created_at AS date FROM users WHERE user_id = ?`,
        [id]
      );
      returnRow = rows[0];
    }

    return res.json({ user: returnRow });

  } catch (err) {
    await conn.rollback();
    console.error('updateUser error:', err);
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'This email is already in use by another account.' });
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// DELETE USER  DELETE /api/admin/users/:id?role=
// ══════════════════════════════════════════════════════════
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'User not found.' });

    return res.json({ message: 'User deleted successfully.' });

  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// IMPORT USERS  POST /api/admin/users/import
// ══════════════════════════════════════════════════════════
exports.importUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0)
      return res.status(400).json({ message: 'No users to import.' });

    const results = [];
    const errors  = [];

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      try {
        const tempPassword = crypto.randomBytes(5).toString('base64').slice(0, 9);
        const hashedPw     = await bcrypt.hash(tempPassword, 10);
        const token        = crypto.randomBytes(32).toString('hex');
        const expires      = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const [result] = await db.query(
          `INSERT INTO users (name, email, password, role, active_status,
           activation_token, token_expires_at, created_at)
           VALUES (?, ?, ?, ?, 'inactive', ?, ?, NOW())`,
          [u.name, u.email, hashedPw, role, token, expires]
        );

        const userId = result.insertId;

        if (role === 'industry_partner') {
          await db.query(
            `INSERT INTO industry_partners
               (user_id, company_name, contact_person_phone, industry_sector, location)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, u.company_name || null, u.phone || null, u.industry_sector || null, u.location || null]
          );
        } else if (role === 'industry_supervisor') {
          await db.query(
            `INSERT INTO industry_supervisors (user_id, phone, position, partner_id) VALUES (?, ?, ?, ?)`,
            [userId, u.phone || null, u.position || null, u.partner_id || null]
          );
        } else if (role === 'manager') {
          await db.query(
            `INSERT INTO managers (user_id, phone) VALUES (?, ?)`,
            [userId, u.phone || null]
           );
        }

        sendBulkActivationEmail(u.email, u.name, tempPassword, token, role);

        results.push({ id: userId, name: u.name, email: u.email });

      } catch (err) {
        errors.push({
          row:    i + 1,
          email:  u.email,
          reason: err.code === 'ER_DUP_ENTRY' ? 'Email already exists.' : 'Failed to import this row.',
        });
      }
    }

    return res.json({
      message:  `Imported ${results.length} users. ${errors.length} failed.`,
      imported: results,
      errors,
    });

  } catch (err) {
    console.error('importUsers error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// STATS   GET /api/admin/stats
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
      draft:              0,
      submitted:          0,
      interview:          0,
      approved:           0,
      rejected:           0,
      accepted:           0,
      declined:           0,
      withdraw:           0,
      pending:            0,
      under_review:       0,
      rejected_review:    0,
      rejected_interview: 0,
    };
    statusCounts.forEach(({ status, count }) => {
      if (Object.prototype.hasOwnProperty.call(applicantByStatus, status))
        applicantByStatus[status] = count;
    });

    applicantByStatus._submitted_total =
      applicantByStatus.submitted + applicantByStatus.under_review;
    applicantByStatus._rejected_total =
      applicantByStatus.rejected + applicantByStatus.rejected_review + applicantByStatus.rejected_interview;

    const [monthlyRows] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b') AS month,
             MONTH(created_at)             AS month_num,
             YEAR(created_at)              AS year,
             role,
             COUNT(*)                      AS count
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

    const [slotStats] = await db.query(
      `SELECT COUNT(*) AS total_slots,
              SUM(capacity) AS total_capacity,
              (SELECT COUNT(*) FROM applications WHERE interview_slot_id IS NOT NULL AND status NOT IN ('draft','declined','withdraw')) AS total_booked
       FROM interview_slots`
    );

    return res.json({
      totals,
      applicantByStatus,
      monthly: Object.values(map),
      slotStats: slotStats[0] || { total_slots: 0, total_capacity: 0, total_booked: 0 },
    });

  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN ADD USER
// ══════════════════════════════════════════════════════════
exports.addUserByAdmin = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name, email, role,
      phone,
      company_name,
      industry_sector, location,
      position,
      partner_id,
    } = req.body;

    if (!name || !email || !role) {
      await conn.rollback();
      return res.status(400).json({ message: 'Name, Email, and Role are required.' });
    }

    if (!['industry_partner', 'industry_supervisor', 'manager'].includes(role)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Role must be industry_partner, industry_supervisor, or manager.' });
    }

    const [existing] = await conn.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const tempPassword    = crypto.randomBytes(5).toString('base64').slice(0, 9);
    const hashedPassword  = await bcrypt.hash(tempPassword, 10);
    const activationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt  = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password, role, active_status, activation_token, token_expires_at, created_at)
       VALUES (?, ?, ?, ?, 'inactive', ?, ?, NOW())`,
      [name, email, hashedPassword, role, activationToken, tokenExpiresAt]
    );
    const userId = userResult.insertId;

    if (role === 'industry_partner') {
      await conn.query(
        `INSERT INTO industry_partners
           (user_id, company_name, contact_person_phone, industry_sector, location)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, company_name || null, phone || null, industry_sector || null, location || null]
      );
    }

    if (role === 'industry_supervisor') {
      await conn.query(
        `INSERT INTO industry_supervisors (user_id, phone, position, partner_id) VALUES (?, ?, ?, ?)`,
        [userId, phone || null, position || null, partner_id || null]
      );
    }

    if (role === 'manager') {
      await conn.query(
        `INSERT INTO managers (user_id, phone) VALUES (?, ?)`,
        [userId, phone || null]
      );
    }

    await conn.commit();
    sendBulkActivationEmail(email, name, tempPassword, activationToken, role);

    res.json({
      message: 'User added successfully! An activation email has been sent.',
      user: {
        id:                  userId,
        name,
        contact_person_name: name,
        email,
        role,
        status: 'inactive',
        phone:  phone || null,
        ...(role === 'industry_partner' && {
          company_name:    company_name    || null,
          industry_sector: industry_sector || null,
          location:        location        || null,
        }),
        ...(role === 'industry_supervisor' && {
          position:   position   || null,
          partner_id: partner_id || null,
          company:    '',
        }),
        ...(role === 'manager' && {
          phone: phone || null,
        }),
        date: new Date().toISOString(),
      },
    });

  } catch (err) {
    await conn.rollback();
    console.error('addUserByAdmin error:', err);
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'A user with this email already exists.' });
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
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
      SELECT
        ip.partner_id,
        COALESCE(ip.company_name, u.name) AS company_name,
        ip.industry_sector,
        ip.location
      FROM industry_partners ip
      JOIN users u ON u.user_id = ip.user_id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      sql += ` AND (ip.company_name LIKE ? OR u.name LIKE ? OR ip.industry_sector LIKE ? OR ip.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY COALESCE(ip.company_name, u.name) ASC';

    const [rows] = await db.query(sql, params);
    return res.json({ partners: rows });

  } catch (err) {
    console.error('listPartners error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/manager/stats
// ══════════════════════════════════════════════════════════
exports.getManagerStats = async (req, res) => {
  try {
    const [statusCounts] = await db.query(
      `SELECT status, COUNT(*) AS count FROM applications GROUP BY status`
    );

    const applicationByStatus = {
      draft:     0,
      submitted: 0,
      attended:  0,
      absent:    0,
      passed:    0,
      failed:    0,
    };

    statusCounts.forEach(({ status, count }) => {
      if (Object.prototype.hasOwnProperty.call(applicationByStatus, status))
        applicationByStatus[status] = count;
    });

    const total = Object.values(applicationByStatus).reduce((a, b) => a + b, 0);

    return res.json({ applicationByStatus, total });

  } catch (err) {
    console.error('getManagerStats error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};