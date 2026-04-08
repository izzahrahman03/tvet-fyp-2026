// controllers/internshipApplicationControllers.js
// Industry partner manages internship applications for their vacancies.

const db = require('../database/db');
const { sendInternshipStatusEmail } = require('../emails/internshipEmail');

async function getPartnerIdFromUser(userId) {
  const [rows] = await db.query(
    'SELECT partner_id FROM industry_partners WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0)
    throw { status: 403, message: 'No industry partner profile found for this account.' };
  return rows[0].partner_id;
}


// ══════════════════════════════════════════════════════════
// LIST   GET /api/partner/internship-applications
// ══════════════════════════════════════════════════════════
exports.listApplications = async (req, res) => {
  try {
    const partnerId = await getPartnerIdFromUser(req.user.id);
    const { search, status, vacancy_id } = req.query;

    let sql = `
      SELECT
        ia.internship_application_id  AS id,
        ia.internship_application_id,
        ia.student_id,
        ia.vacancy_id,
        ia.internship_application_status AS status,
        ia.internship_application_date   AS applied_date,
        ia.resume_path,
        ia.cover_letter_path,
        ia.created_at,
        u.name  AS student_name,
        u.email AS student_email,
        v.position_name,
        ii.interview_datetime,
        ii.interview_location
      FROM internship_applications ia
      JOIN students  s  ON s.student_id = ia.student_id
      JOIN users     u  ON u.user_id    = s.user_id
      JOIN vacancies v  ON v.vacancy_id = ia.vacancy_id
      LEFT JOIN internship_interviews ii
        ON ii.internship_application_id = ia.internship_application_id
      WHERE ia.partner_id = ?
    `;
    const params = [partnerId];

    if (status && status !== 'All') {
      sql += ` AND ia.internship_application_status = ?`;
      params.push(status.toLowerCase());
    }
    if (vacancy_id) {
      sql += ` AND ia.vacancy_id = ?`;
      params.push(vacancy_id);
    }
    if (search) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR v.position_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY ia.created_at DESC';

    const [rows] = await db.query(sql, params);
    return res.json({ applications: rows });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('listApplications (partner) error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// UPDATE STATUS   PUT /api/partner/internship-applications/:id/status
// Partner can set: interview, passed, failed only.
// accepted/declined are student actions. withdraw is via approveWithdraw.
// ══════════════════════════════════════════════════════════
exports.updateApplicationStatus = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const partnerId = await getPartnerIdFromUser(req.user.id);
    const { id }    = req.params;
    const { status, interview_datetime, interview_location } = req.body;

    const ALLOWED = ['interview', 'passed', 'failed'];
    if (!status || !ALLOWED.includes(status.toLowerCase()))
      return res.status(400).json({ message: `Status must be one of: ${ALLOWED.join(', ')}.` });

    if (status === 'interview') {
      if (!interview_datetime)
        return res.status(400).json({ message: 'Interview date & time is required.' });
      if (!interview_location?.trim())
        return res.status(400).json({ message: 'Interview location is required.' });
    }

    const [rows] = await conn.query(
      `SELECT
         ia.internship_application_id,
         u.name  AS student_name,
         u.email AS student_email,
         v.position_name,
         COALESCE(ip.company_name, cu.name) AS company_name
       FROM internship_applications ia
       JOIN students          s   ON s.student_id  = ia.student_id
       JOIN users             u   ON u.user_id      = s.user_id
       JOIN vacancies         v   ON v.vacancy_id   = ia.vacancy_id
       JOIN industry_partners ip  ON ip.partner_id  = ia.partner_id
       JOIN users             cu  ON cu.user_id      = ip.user_id
       WHERE ia.internship_application_id = ? AND ia.partner_id = ?`,
      [id, partnerId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }

    const app = rows[0];

    await conn.query(
      `UPDATE internship_applications
       SET internship_application_status = ?
       WHERE internship_application_id = ?`,
      [status.toLowerCase(), id]
    );

    if (status === 'interview') {
      await conn.query(
        `INSERT INTO internship_interviews
           (internship_application_id, interview_datetime, interview_location)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           interview_datetime = VALUES(interview_datetime),
           interview_location = VALUES(interview_location)`,
        [id, interview_datetime, interview_location.trim()]
      );
    }

    await conn.commit();

    sendInternshipStatusEmail(
      app.student_email, app.student_name,
      app.position_name, app.company_name,
      status.toLowerCase(),
      status === 'interview'
        ? { interview_datetime, interview_location: interview_location.trim() }
        : null
    );

    return res.json({ message: 'Status updated successfully.' });

  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('updateApplicationStatus (partner) error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// APPROVE WITHDRAW   PUT /api/partner/internship-applications/:id/approve-withdraw
// Partner approves a student's withdrawal request.
// Changes status from "withdraw_requested" → "withdraw".
// ══════════════════════════════════════════════════════════
exports.approveWithdraw = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const partnerId = await getPartnerIdFromUser(req.user.id);
    const { id }    = req.params;

    const [appRows] = await conn.query(
      `SELECT
         ia.internship_application_status AS status,
         ia.vacancy_id,
         u.name  AS student_name,
         u.email AS student_email,
         v.position_name,
         COALESCE(ip.company_name, cu.name) AS company_name
       FROM internship_applications ia
       JOIN students          s  ON s.student_id  = ia.student_id
       JOIN users             u  ON u.user_id      = s.user_id
       JOIN vacancies         v  ON v.vacancy_id   = ia.vacancy_id
       JOIN industry_partners ip ON ip.partner_id  = ia.partner_id
       JOIN users             cu ON cu.user_id      = ip.user_id
       WHERE ia.internship_application_id = ? AND ia.partner_id = ?`,
      [id, partnerId]
    );

    if (appRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }
    if (appRows[0].status !== 'withdrawn_requested') {
      await conn.rollback();
      return res.status(400).json({ message: 'Application is not pending withdrawal approval.' });
    }

    await conn.query(
      `UPDATE internship_applications
       SET internship_application_status = 'withdrawn'
       WHERE internship_application_id = ?`,
      [id]
    );

    // Restore the slot since the accepted student is withdrawing
    await conn.query(
      `UPDATE vacancies SET capacity = capacity + 1 WHERE vacancy_id = ?`,
      [appRows[0].vacancy_id]
    );

    await conn.commit();

    const app = appRows[0];
    sendInternshipStatusEmail(
      app.student_email, app.student_name,
      app.position_name, app.company_name,
      'withdrawn'
    );

    return res.json({ message: 'Withdrawal approved.' });

  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('approveWithdraw error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// DOWNLOAD DOCUMENT
// ══════════════════════════════════════════════════════════
exports.downloadDocument = async (req, res) => {
  try {
    const partnerId    = await getPartnerIdFromUser(req.user.id);
    const { id, type } = req.params;

    if (!['resume', 'cover_letter'].includes(type))
      return res.status(400).json({ message: 'type must be resume or cover_letter.' });

    const col = type === 'resume' ? 'resume_path' : 'cover_letter_path';

    const [rows] = await db.query(
      `SELECT ${col} AS file_path FROM internship_applications
       WHERE internship_application_id = ? AND partner_id = ?`,
      [id, partnerId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Application not found.' });

    const filePath = rows[0].file_path;
    if (!filePath)
      return res.status(404).json({ message: 'Document not found.' });

    const fullPath = require('path').join(__dirname, '..', 'uploads', 'internship_docs', filePath);
    if (!require('fs').existsSync(fullPath))
      return res.status(404).json({ message: 'File not found on server.' });

    return res.download(fullPath, filePath);

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('downloadDocument error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};