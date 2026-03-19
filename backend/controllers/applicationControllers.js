const db     = require('../database/db');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const { sendApplicationStatusEmail } = require('../emails/adminEmail');

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
      const labels = {
        fullName: 'Full Name', icNumber: 'IC Number', dob: 'Date of Birth',
        gender: 'Gender', race: 'Race', maritalStatus: 'Marital Status',
        email: 'Email', phone: 'Phone', streetAddress: 'Street Address',
        city: 'City', postalCode: 'Postal Code', state: 'State', country: 'Country',
      };
      const friendlyMissing = missing.map(k => labels[k] || k);
      return res.status(400).json({ message: `Missing required fields: ${friendlyMissing.join(', ')}` });
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
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
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
    console.error('getMyApplication:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ACCEPT OFFER
// ══════════════════════════════════════════════════════════
exports.acceptOffer = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user.id;

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

    await conn.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
      ['accepted', appId]
    );

    await conn.query(
      "UPDATE users SET role = 'student', active_status = 'active' WHERE user_id = ?",
      [userId]
    );

    const [intakes] = await conn.query(
      `SELECT
        i.intake_id,
        i.intake_name,
        i.max_capacity,
        COUNT(s.student_id) AS current_count
       FROM intakes i
       LEFT JOIN students s ON s.intake_id = i.intake_id
       WHERE CURDATE() BETWEEN i.start_date AND i.end_date
       GROUP BY i.intake_id
       HAVING current_count < i.max_capacity
       ORDER BY i.start_date DESC
       LIMIT 1`,
      []
    );

    const activeIntake = intakes.length > 0 ? intakes[0] : null;
    const intakeId     = activeIntake ? activeIntake.intake_id : null;

    const year = new Date().getFullYear();

    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total FROM students WHERE YEAR(created_at) = ?`,
      [year]
    );
    const sequence     = String(countRows[0].total + 1).padStart(5, '0');
    const matricNumber = `STU-${year}-${sequence}`;

    await conn.query(
      `INSERT INTO students (user_id, application_id, intake_id, matric_number, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, appId, intakeId, matricNumber]
    );

    await conn.commit();

    const intakeMsg = activeIntake
      ? `You have been assigned to ${activeIntake.intake_name}.`
      : 'No active intake found — an admin will assign your intake shortly.';

    return res.json({
      message:       `Offer accepted! Your matric number is ${matricNumber}. ${intakeMsg} Please log in again to access the student portal.`,
      matric_number: matricNumber,
      intake_name:   activeIntake?.intake_name || null,
    });

  } catch (err) {
    await conn.rollback();
    console.error('acceptOffer:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// WITHDRAW OFFER
// ══════════════════════════════════════════════════════════
exports.withdrawOffer = async (req, res) => {
  try {
    const userId = req.user.id;

    const [apps] = await db.query(
      'SELECT application_id, status FROM applications WHERE user_id = ?',
      [userId]
    );

    if (apps.length === 0)
      return res.status(404).json({ message: 'No application found.' });

    const allowedStatuses = ['approved', 'interview', 'under_review', 'pending'];
    if (!allowedStatuses.includes(apps[0].status)) {
      return res.status(400).json({
        message: `Cannot withdraw from current status: ${apps[0].status}`,
      });
    }

    await db.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
      ['withdraw', apps[0].application_id]
    );

    return res.json({ message: 'Application withdrawn successfully.' });

  } catch (err) {
    console.error('withdrawOffer:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN LIST APPLICATIONS
// ══════════════════════════════════════════════════════════
exports.adminListApplications = async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT
        a.application_id AS id,
        a.name, a.email, a.phone,
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
    console.error('adminListApplications:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN VIEW ONE APPLICATION
// ══════════════════════════════════════════════════════════
exports.adminGetApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
        a.application_id AS id,
        a.*,
        ai.interview_datetime,
        ai.venue,
        ai.interviewer_name,
        ai.remarks
       FROM applications a
       LEFT JOIN application_interviews ai ON ai.application_id = a.application_id
       WHERE a.application_id = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Application not found.' });

    const app = rows[0];
    const [education] = await db.query(
      'SELECT * FROM application_education WHERE application_id = ?', [id]
    );
    const [skills] = await db.query(
      'SELECT * FROM application_skills WHERE application_id = ?', [id]
    );

    return res.json({ application: { ...app, education, skills } });

  } catch (err) {
    console.error('adminGetApplication:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN DELETE APPLICATION
// ══════════════════════════════════════════════════════════
exports.adminDeleteApplication = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;

    await conn.query('DELETE FROM application_education  WHERE application_id = ?', [id]);
    await conn.query('DELETE FROM application_skills     WHERE application_id = ?', [id]);
    await conn.query('DELETE FROM application_interviews WHERE application_id = ?', [id]);

    const [result] = await conn.query(
      'DELETE FROM applications WHERE application_id = ?', [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }

    await conn.commit();
    return res.json({ message: 'Application deleted successfully.' });

  } catch (err) {
    await conn.rollback();
    console.error('adminDeleteApplication:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN UPDATE STATUS
// ══════════════════════════════════════════════════════════
exports.adminUpdateStatus = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const { status, interview_datetime, venue, interviewer_name, remarks } = req.body;

    const VALID = [
      'pending', 'under_review', 'interview',
      'approved', 'accepted',
      'rejected_review', 'rejected_interview',
      'withdraw',
    ];

    if (!VALID.includes(status)) {
      await conn.rollback();
      return res.status(400).json({ message: `Status must be one of: ${VALID.join(', ')}` });
    }

    const [result] = await conn.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }

    // ── Persist interview details when status is 'interview' ──
    if (status === 'interview') {
      if (!interview_datetime || !venue || !interviewer_name) {
        await conn.rollback();
        return res.status(400).json({
          message: 'interview_datetime, venue, and interviewer_name are required when status is "interview".',
        });
      }

      await conn.query(
        `INSERT INTO application_interviews
           (application_id, interview_datetime, venue, interviewer_name, remarks)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           interview_datetime = VALUES(interview_datetime),
           venue              = VALUES(venue),
           interviewer_name   = VALUES(interviewer_name),
           remarks            = VALUES(remarks)`,
        [id, interview_datetime, venue, interviewer_name, remarks || null]
      );
    }

    await conn.commit();

    // ── Fetch the updated row for the response and the email ──
    const [rows] = await db.query(
      `SELECT
        a.application_id AS id,
        a.name, a.email, a.phone,
        a.status, a.created_at, u.user_id
       FROM applications a
       JOIN users u ON u.user_id = a.user_id
       WHERE a.application_id = ?`,
      [id]
    );

    const application = rows[0] || null;

    // ── Send status notification email to the applicant ──────
    // Only statuses that have an entry in STATUS_CONFIG will send.
    // 'pending' is intentionally excluded (no email needed).
    //
    // Signature: sendApplicationStatusEmail(
    //   toEmail,        — applicant's email from the applications table
    //   applicantName,  — applicant's name from the applications table
    //   status,         — one of the VALID statuses above
    //   interviewDetails — { datetime, venue, interviewer_name, remarks } | null
    // )
    if (application) {
      const interviewDetails = status === 'interview'
        ? {
            datetime:         interview_datetime,
            venue,
            interviewer_name,
            remarks: remarks || null,
          }
        : null;

      sendApplicationStatusEmail(
        application.email,       // ✅ from the fetched row — not undefined
        application.name,        // ✅ from the fetched row — not undefined
        status,                  // ✅ the validated status string
        interviewDetails         // ✅ object when interview, null otherwise
      );
      // Fire-and-forget: email errors are caught inside sendApplicationStatusEmail
      // and logged, so they will never crash the HTTP response.
    }

    return res.json({
      message:     `Application status updated to ${status}.`,
      application,
    });

  } catch (err) {
    await conn.rollback();
    console.error('adminUpdateStatus:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};