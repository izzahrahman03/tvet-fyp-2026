// controllers/internshipControllers.js
// Student-facing internship endpoints.

const db     = require('../database/db');
const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const { sendInternshipStatusEmail } = require('../emails/internshipEmail');

// ── Multer config ─────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'internship_docs');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req,  file,  cb) => {
    const ext  = path.extname(file.originalname);
    const safe = file.fieldname + '_' + req.user.id + '_' + Date.now() + ext;
    cb(null, safe);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only PDF and Word documents are allowed.'));
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'resume',       maxCount: 1 },
  { name: 'cover_letter', maxCount: 1 },
]);

// ── Helper: get student_id from user_id ───────────────────
async function getStudentId(userId) {
  const [rows] = await db.query(
    'SELECT student_id FROM students WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0)
    throw { status: 403, message: 'No student profile found for this account.' };
  return rows[0].student_id;
}


// ══════════════════════════════════════════════════════════
// LIST OPEN VACANCIES   GET /api/student/internship-vacancies
// ══════════════════════════════════════════════════════════
exports.listVacancies = async (req, res) => {
  try {
    const studentId  = await getStudentId(req.user.id);
    const { search } = req.query;

    let sql = `
      SELECT
        v.vacancy_id,
        v.partner_id,
        v.position_name,
        v.capacity,
        v.description,
        v.responsibilities,
        v.start_date,
        v.end_date,
        v.status,
        COALESCE(ip.company_name, u.name) AS company_name,
        ip.industry_sector,
        ip.location,
        ip.contact_person_phone,
        u.name AS contact_person_name,
        u.email AS contact_person_email,
        CASE WHEN ia.internship_application_id IS NOT NULL THEN 1 ELSE 0 END AS already_applied,
        ia.internship_application_status AS my_application_status
      FROM vacancies v
      JOIN industry_partners ip ON ip.partner_id = v.partner_id
      JOIN users             u  ON u.user_id      = ip.user_id
      LEFT JOIN internship_applications ia
        ON ia.vacancy_id = v.vacancy_id AND ia.student_id = ?
      WHERE v.status = 'open'
        AND v.capacity > 0
    `;
    const params = [studentId];

    if (search) {
      sql += ` AND (v.position_name LIKE ? OR ip.company_name LIKE ? OR ip.industry_sector LIKE ? OR ip.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY v.created_at DESC';

    const [rows] = await db.query(sql, params);
    return res.json({ vacancies: rows });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('listVacancies (student) error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// SUBMIT APPLICATION   POST /api/student/internship-apply
// ══════════════════════════════════════════════════════════
exports.applyVacancy = async (req, res) => {
  try {
    const studentId      = await getStudentId(req.user.id);
    const { vacancy_id } = req.body;

    if (!vacancy_id)
      return res.status(400).json({ message: 'vacancy_id is required.' });

    const [vacRows] = await db.query(
      'SELECT vacancy_id, partner_id, status FROM vacancies WHERE vacancy_id = ?',
      [vacancy_id]
    );
    if (vacRows.length === 0)
      return res.status(404).json({ message: 'Vacancy not found.' });
    if (vacRows[0].status !== 'open')
      return res.status(400).json({ message: 'This vacancy is no longer open.' });

    if (!req.files?.resume?.[0])
      return res.status(400).json({ message: 'Resume is required.' });

    const [dupCheck] = await db.query(
      'SELECT internship_application_id FROM internship_applications WHERE student_id = ? AND vacancy_id = ?',
      [studentId, vacancy_id]
    );
    if (dupCheck.length > 0)
      return res.status(409).json({ message: 'You have already applied for this vacancy.' });

    const resumePath      = req.files.resume[0].filename;
    const coverLetterPath = req.files?.cover_letter?.[0]?.filename || null;
    const partnerId       = vacRows[0].partner_id;

    await db.query(
      `INSERT INTO internship_applications
         (student_id, partner_id, vacancy_id, resume_path, cover_letter_path,
          internship_application_status, internship_application_date)
       VALUES (?, ?, ?, ?, ?, 'pending', CURDATE())`,
      [studentId, partnerId, vacancy_id, resumePath, coverLetterPath]
    );

    return res.status(201).json({ message: 'Application submitted successfully.' });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('applyVacancy error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// MY APPLICATIONS   GET /api/student/my-internship-applications
// ══════════════════════════════════════════════════════════
exports.myApplications = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);

    const [rows] = await db.query(
      `SELECT
         ia.internship_application_id,
         ia.vacancy_id,
         ia.internship_application_status AS status,
         ia.internship_application_date   AS applied_date,
         v.position_name,
         v.start_date,
         v.end_date,
         COALESCE(ip.company_name, u.name) AS company_name,
         ip.industry_sector,
         ip.location,
         ip.contact_person_phone,
         u.name AS contact_person_name,
         u.email AS contact_person_email,
         ii.interview_datetime,
         ii.interview_location
       FROM internship_applications ia
       JOIN vacancies         v  ON v.vacancy_id  = ia.vacancy_id
       JOIN industry_partners ip ON ip.partner_id = ia.partner_id
       JOIN users             u  ON u.user_id      = ip.user_id
       LEFT JOIN internship_interviews ii
         ON ii.internship_application_id = ia.internship_application_id
       WHERE ia.student_id = ?
       ORDER BY ia.created_at DESC`,
      [studentId]
    );

    return res.json({ applications: rows });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('myApplications error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ACCEPT OFFER   POST /api/student/internship-accept/:id
// Student accepts a "passed" application.
// A student can only have ONE accepted internship at a time.
// ══════════════════════════════════════════════════════════
exports.acceptOffer = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const studentId = await getStudentId(req.user.id);
    const { id }    = req.params;

    // Confirm this application belongs to student and is passed
    const [appRows] = await conn.query(
      `SELECT
         ia.internship_application_id,
         ia.vacancy_id,
         ia.internship_application_status AS status,
         v.position_name,
         v.capacity,
         COALESCE(ip.company_name, cu.name) AS company_name,
         u.email AS student_email,
         u.name  AS student_name
       FROM internship_applications ia
       JOIN students          s  ON s.student_id  = ia.student_id
       JOIN users             u  ON u.user_id      = s.user_id
       JOIN vacancies         v  ON v.vacancy_id   = ia.vacancy_id
       JOIN industry_partners ip ON ip.partner_id  = ia.partner_id
       JOIN users             cu ON cu.user_id      = ip.user_id
       WHERE ia.internship_application_id = ? AND ia.student_id = ?`,
      [id, studentId]
    );

    if (appRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (appRows[0].status !== 'passed') {
      await conn.rollback();
      return res.status(400).json({ message: 'You can only accept an offer with status "passed".' });
    }

    if (appRows[0].capacity <= 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'No slots remaining for this vacancy.' });
    }

    // Check student doesn't already have an accepted application
    const [alreadyAccepted] = await conn.query(
      `SELECT internship_application_id FROM internship_applications
       WHERE student_id = ? AND internship_application_status IN ('accepted', 'withdrawn_requested')`,
      [studentId]
    );
    if (alreadyAccepted.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        message: 'You already have an active internship. Your withdrawal must be approved before accepting a new offer.',
      });
    }

    await conn.query(
      `UPDATE internship_applications
       SET internship_application_status = 'accepted'
       WHERE internship_application_id = ?`,
      [id]
    );

    // Decrement capacity by 1 when a student accepts
    await conn.query(
      `UPDATE vacancies SET capacity = capacity - 1 WHERE vacancy_id = ? AND capacity > 0`,
      [appRows[0].vacancy_id]
    );

    await conn.commit();

    const app = appRows[0];
    sendInternshipStatusEmail(
      app.student_email, app.student_name,
      app.position_name, app.company_name,
      'accepted'
    );

    return res.json({ message: 'Offer accepted successfully.' });

  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('acceptOffer error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// DECLINE OFFER   POST /api/student/internship-decline/:id
// Student declines a "passed" application.
// ══════════════════════════════════════════════════════════
exports.declineOffer = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    const { id }    = req.params;

    const [appRows] = await db.query(
      `SELECT ia.internship_application_status AS status
       FROM internship_applications ia
       WHERE ia.internship_application_id = ? AND ia.student_id = ?`,
      [id, studentId]
    );

    if (appRows.length === 0)
      return res.status(404).json({ message: 'Application not found.' });
    if (appRows[0].status !== 'passed')
      return res.status(400).json({ message: 'You can only decline an offer with status "passed".' });

    await db.query(
      `UPDATE internship_applications
       SET internship_application_status = 'declined'
       WHERE internship_application_id = ?`,
      [id]
    );

    return res.json({ message: 'Offer declined.' });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('declineOffer error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// REQUEST WITHDRAW   POST /api/student/internship-withdraw/:id
// Student requests withdrawal of an "accepted" application.
// Sets status to "withdraw_requested" — partner must approve.
// ══════════════════════════════════════════════════════════
exports.requestWithdraw = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    const { id }    = req.params;

    const [appRows] = await db.query(
      `SELECT ia.internship_application_status AS status
       FROM internship_applications ia
       WHERE ia.internship_application_id = ? AND ia.student_id = ?`,
      [id, studentId]
    );

    if (appRows.length === 0)
      return res.status(404).json({ message: 'Application not found.' });
    if (appRows[0].status !== 'accepted')
      return res.status(400).json({ message: 'You can only withdraw an accepted application.' });

    await db.query(
      `UPDATE internship_applications
       SET internship_application_status = 'withdrawn_requested'
       WHERE internship_application_id = ?`,
      [id]
    );

    return res.json({ message: 'Withdrawal request submitted. Awaiting partner approval.' });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('requestWithdraw error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};