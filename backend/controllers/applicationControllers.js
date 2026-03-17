const db     = require('../database/db');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ─── Multer config ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/applications');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `app_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Images only.'));
  },
});

exports.uploadMiddleware = upload.single('avatar');


// ══════════════════════════════════════════════════════════
// SUBMIT APPLICATION
// ══════════════════════════════════════════════════════════
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      fullName, icNumber, dob, gender, race, maritalStatus,
      email, phone, streetAddress, city, postalCode, state, country,
    } = req.body;

    let education = [], skills = [];
    try { education = JSON.parse(req.body.education || '[]'); } catch {}
    try { skills    = JSON.parse(req.body.skills    || '[]'); } catch {}

    const required = { fullName, icNumber, dob, gender, race, maritalStatus, email, phone, streetAddress, city, postalCode, state, country };
    const missing  = Object.entries(required).filter(([, v]) => !v?.trim()).map(([k]) => k);

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    const avatarUrl = req.file ? `/uploads/applications/${req.file.filename}` : null;

    const [rows] = await db.query(
      'SELECT application_id FROM applications WHERE user_id = ?',
      [userId]
    );

    let appId;

    if (rows.length > 0) {
      appId = rows[0].application_id;

      await db.query(
        `UPDATE applications SET
          name=?, ic_number=?, date_of_birth=?, gender=?, race=?,
          marital_status=?, email=?, phone=?, street_address=?, city=?,
          postal_code=?, state=?, country=?, avatar_url=COALESCE(?,avatar_url),
          status='pending', updated_at=NOW()
        WHERE application_id=?`,
        [fullName, icNumber, dob, gender, race, maritalStatus, email, phone,
         streetAddress, city, postalCode, state, country, avatarUrl, appId]
      );

      await db.query('DELETE FROM application_education WHERE application_id=?', [appId]);
      await insertEducation(appId, education);
      await db.query('DELETE FROM application_skills WHERE application_id=?', [appId]);
      await insertSkills(appId, skills);

      return res.json({ message: 'Application updated', application_id: appId });

    } else {
      const [result] = await db.query(
        `INSERT INTO applications
        (user_id, name, ic_number, date_of_birth, gender, race, marital_status,
         email, phone, street_address, city, postal_code, state, country, avatar_url, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',NOW(),NOW())`,
        [userId, fullName, icNumber, dob, gender, race, maritalStatus,
         email, phone, streetAddress, city, postalCode, state, country, avatarUrl]
      );

      appId = result.insertId;
      await insertEducation(appId, education);
      await insertSkills(appId, skills);

      return res.status(201).json({ message: 'Application submitted', application_id: appId });
    }

  } catch (err) {
    console.error('submitApplication:', err);
    return res.status(500).json({ message: err.message });
  }
};


// ─── Helpers ──────────────────────────────────────────────
async function insertEducation(appId, rows) {
  if (!rows?.length) return;
  const values = rows
    .filter(r => r.institute?.trim())
    .map(r => [appId, r.institute, r.qualification, r.major, r.startDate || null, r.endDate || null]);
  if (!values.length) return;
  await db.query(
    'INSERT INTO application_education (application_id, institute_name, qualification, major, start_date, end_date) VALUES ?',
    [values]
  );
}

async function insertSkills(appId, rows) {
  if (!rows?.length) return;
  const values = rows
    .filter(r => r.skillName?.trim())
    .map(r => [appId, r.skillName, r.proficiency]);
  if (!values.length) return;
  await db.query(
    'INSERT INTO application_skills (application_id, skill_name, proficiency) VALUES ?',
    [values]
  );
}


// ══════════════════════════════════════════════════════════
// GET MY APPLICATION
// ══════════════════════════════════════════════════════════
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT
        a.*,
        ai.interview_datetime,
        ai.venue,
        ai.interviewer_name,
        ai.remarks
       FROM applications a
       LEFT JOIN application_interviews ai ON ai.application_id = a.application_id
       WHERE a.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) return res.json({ application: null });

    const app   = rows[0];
    const appId = app.application_id;

    const [education] = await db.query(
      'SELECT * FROM application_education WHERE application_id = ?', [appId]
    );
    const [skills] = await db.query(
      'SELECT * FROM application_skills WHERE application_id = ?', [appId]
    );

    return res.json({ application: { ...app, education, skills } });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ══════════════════════════════════════════════════════════
// ACCEPT OFFER  POST /api/my-application/accept
// ─────────────────────────────────────────────────────────
// When the applicant accepts:
//   1. application.status  → 'accepted'
//   2. users.role          → 'student'
//   3. users.active_status → 'active'
// The applicant must re-login to get a fresh JWT with role=student.
// ══════════════════════════════════════════════════════════
exports.acceptOffer = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user.id;

    // Verify application exists and is in 'approved' state
    const [apps] = await conn.query(
      'SELECT application_id, status FROM applications WHERE user_id = ?',
      [userId]
    );

    if (apps.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'No application found.' });
    }

    if (apps[0].status !== 'approved') {
      await conn.rollback();
      return res.status(400).json({ message: 'Your application is not in an approved state.' });
    }

    const appId = apps[0].application_id;

    // 1. Update application status → accepted
    await conn.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
      ['accepted', appId]
    );

    // 2. Update user role → student and activate account
    await conn.query(
      "UPDATE users SET role = 'student', active_status = 'active' WHERE user_id = ?",
      [userId]
    );

    await conn.commit();

    return res.json({
      message: 'Offer accepted! Your account has been upgraded to Student. Please log in again to access the student portal.',
    });

  } catch (err) {
    await conn.rollback();
    console.error('acceptOffer:', err);
    return res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// WITHDRAW OFFER  POST /api/my-application/withdraw
// ─────────────────────────────────────────────────────────
// Applicant declines the approved offer → status = 'withdraw'
// ══════════════════════════════════════════════════════════
exports.withdrawOffer = async (req, res) => {
  try {
    const userId = req.user.id;

    const [apps] = await db.query(
      'SELECT application_id, status FROM applications WHERE user_id = ?',
      [userId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ message: 'No application found.' });
    }

    // Allow withdraw from approved OR interview stage
    const allowedStatuses = ['approved', 'interview', 'under_review', 'pending'];
    if (!allowedStatuses.includes(apps[0].status)) {
      return res.status(400).json({
        message: `Cannot withdraw from current status: ${apps[0].status}`
      });
    }

    await db.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
      ['withdraw', apps[0].application_id]
    );

    return res.json({ message: 'Application withdrawn successfully.' });

  } catch (err) {
    console.error('withdrawOffer:', err);
    return res.status(500).json({ message: err.message });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN LIST
// ══════════════════════════════════════════════════════════
exports.adminListApplications = async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT a.application_id, a.name, a.email, a.phone,
             a.status, a.created_at, u.user_id
      FROM applications a
      JOIN users u ON u.user_id = a.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (a.name LIKE ? OR a.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY a.created_at DESC';

    const [rows] = await db.query(sql, params);
    return res.json({ applications: rows });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN VIEW ONE
// ══════════════════════════════════════════════════════════
exports.adminGetApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT a.*, ai.interview_datetime, ai.venue, ai.interviewer_name, ai.remarks
       FROM applications a
       LEFT JOIN application_interviews ai ON ai.application_id = a.application_id
       WHERE a.application_id = ?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Not found' });

    const app = rows[0];
    const [education] = await db.query('SELECT * FROM application_education WHERE application_id = ?', [id]);
    const [skills]    = await db.query('SELECT * FROM application_skills WHERE application_id = ?', [id]);

    return res.json({ application: { ...app, education, skills } });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN UPDATE STATUS
// ══════════════════════════════════════════════════════════
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const VALID = [
      'pending', 'under_review', 'interview',
      'approved', 'accepted',
      'rejected_review', 'rejected_interview',
      'withdraw',
    ];

    if (!VALID.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID.join(', ')}` });
    }

    const [result] = await db.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Application not found' });

    return res.json({ message: `Application status updated to ${status}` });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};