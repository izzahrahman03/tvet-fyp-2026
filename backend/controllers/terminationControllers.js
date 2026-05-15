// controllers/terminationControllers.js

const db = require('../database/db');

// ── Helpers ───────────────────────────────────────────────
async function getSupervisorId(userId) {
  const [rows] = await db.query(
    'SELECT supervisor_id FROM industry_supervisors WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0)
    throw { status: 403, message: 'No supervisor profile found for this account.' };
  return rows[0].supervisor_id;
}


// ══════════════════════════════════════════════════════════
// SUPERVISOR: LIST ACTIVE INTERNS
// GET /api/supervisor/active-interns
// Returns accepted applications assigned to this supervisor
// that do NOT already have a pending/approved termination.
// ══════════════════════════════════════════════════════════
exports.listActiveInterns = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);

    const [rows] = await db.query(
      `SELECT
        ia.internship_application_id AS application_id,
        u.name          AS student_name,
        u.email         AS student_email,
        s.matric_number,
        v.position_name,
        v.start_date,
        v.end_date,
        COALESCE(ip.company_name, pu.name) AS company_name
      FROM internship_applications ia
      JOIN students          s   ON s.student_id  = ia.student_id
      JOIN users             u   ON u.user_id     = s.user_id
      JOIN vacancies         v   ON v.vacancy_id  = ia.vacancy_id
      JOIN industry_partners ip  ON ip.partner_id = ia.partner_id
      JOIN users             pu  ON pu.user_id    = ip.user_id
      WHERE ia.supervisor_id = ?
        AND ia.internship_application_status = 'passed'
        AND ia.internship_applicant_response = 'accepted'

        -- exclude students who already have a pending/approved termination
        AND ia.internship_application_id NOT IN (
          SELECT internship_application_id
          FROM internship_terminations
          WHERE status IN ('pending', 'approved')
        )

      ORDER BY u.name ASC`,
      [supervisorId]
    );

    return res.json({ interns: rows });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('listActiveInterns error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// SUPERVISOR: SUBMIT TERMINATION REQUEST
// POST /api/supervisor/terminations
// ══════════════════════════════════════════════════════════
exports.submitTermination = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    const { internship_application_id, reason, details, last_working_date } = req.body;

    // A1 – Input validation
    if (!internship_application_id)
      return res.status(400).json({ message: 'Please select a student.' });
    if (!reason?.trim())
      return res.status(400).json({ message: 'Termination reason is required.' });
    if (!details?.trim())
      return res.status(400).json({ message: 'Termination details are required.' });
    if (!last_working_date)
      return res.status(400).json({ message: 'Last working date is required.' });

    // Verify the application is assigned to this supervisor and is accepted
    const [appRows] = await db.query(
      `SELECT ia.internship_application_id, u.name AS student_name,
              v.position_name, COALESCE(ip.company_name, pu.name) AS company_name
       FROM internship_applications ia
       JOIN students          s   ON s.student_id  = ia.student_id
       JOIN users             u   ON u.user_id      = s.user_id
       JOIN vacancies         v   ON v.vacancy_id   = ia.vacancy_id
       JOIN industry_partners ip  ON ip.partner_id  = ia.partner_id
       JOIN users             pu  ON pu.user_id      = ip.user_id
       WHERE ia.internship_application_id = ?
         AND ia.supervisor_id = ?
         AND ia.internship_application_status = 'passed'
         AND ia.internship_applicant_response = 'accepted'`,
      [internship_application_id, supervisorId]
    );
    if (appRows.length === 0)
      return res.status(404).json({ message: 'Student not found or not assigned to you.' });

    // A2 – Check for existing active termination
    const [existing] = await db.query(
      `SELECT termination_id FROM internship_terminations
       WHERE internship_application_id = ? AND status IN ('pending', 'approved')`,
      [internship_application_id]
    );
    if (existing.length > 0)
      return res.status(409).json({ message: 'A termination request already exists for this student.' });

    await db.query(
      `INSERT INTO internship_terminations
         (internship_application_id, supervisor_id, reason, details, last_working_date, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [internship_application_id, supervisorId, reason.trim(), details.trim(), last_working_date]
    );

    // TODO: send email notification to admin here if email service is set up

    return res.status(201).json({ message: 'Termination request submitted successfully. The administrator has been notified.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('submitTermination error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// SUPERVISOR: MY TERMINATION REQUESTS
// GET /api/supervisor/terminations
// ══════════════════════════════════════════════════════════
exports.myTerminations = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);

    const [rows] = await db.query(
      `SELECT
         t.termination_id,
         t.internship_application_id,
         t.reason,
         t.details,
         t.last_working_date,
         t.status,
         t.admin_remarks,
         t.created_at,
         u.name  AS student_name,
         u.email AS student_email,
         s.matric_number,
         v.position_name,
         COALESCE(ip.company_name, pu.name) AS company_name
       FROM internship_terminations t
       JOIN internship_applications ia ON ia.internship_application_id = t.internship_application_id
       JOIN students          s   ON s.student_id  = ia.student_id
       JOIN users             u   ON u.user_id      = s.user_id
       JOIN vacancies         v   ON v.vacancy_id   = ia.vacancy_id
       JOIN industry_partners ip  ON ip.partner_id  = ia.partner_id
       JOIN users             pu  ON pu.user_id      = ip.user_id
       WHERE t.supervisor_id = ?
       ORDER BY t.created_at DESC`,
      [supervisorId]
    );

    return res.json({ terminations: rows });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('myTerminations error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN: LIST ALL TERMINATION REQUESTS
// GET /api/admin/terminations
// ══════════════════════════════════════════════════════════
exports.adminListTerminations = async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT
        t.termination_id,
        t.internship_application_id,
        t.reason,
        t.details,
        t.last_working_date,
        t.status,
        t.admin_remarks,
        t.created_at,
        t.updated_at,
        -- Student
        u.name          AS student_name,
        u.email         AS student_email,
        s.matric_number,
        -- Internship
        v.position_name,
        v.start_date,
        v.end_date,
        COALESCE(ip.company_name, pu.name) AS company_name,
        -- Supervisor
        sup_u.name      AS supervisor_name,
        sup_u.email     AS supervisor_email,
        sup.position    AS supervisor_position,
        sup.phone       AS supervisor_phone
      FROM internship_terminations t
      JOIN internship_applications ia ON ia.internship_application_id = t.internship_application_id
      JOIN students            s      ON s.student_id  = ia.student_id
      JOIN users               u      ON u.user_id      = s.user_id
      JOIN vacancies           v      ON v.vacancy_id   = ia.vacancy_id
      JOIN industry_partners   ip     ON ip.partner_id  = ia.partner_id
      JOIN users               pu     ON pu.user_id      = ip.user_id
      JOIN industry_supervisors sup   ON sup.supervisor_id = t.supervisor_id
      JOIN users               sup_u  ON sup_u.user_id  = sup.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND t.status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (u.name LIKE ? OR s.matric_number LIKE ? OR COALESCE(ip.company_name, pu.name) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY t.created_at DESC`;

    const [rows] = await db.query(sql, params);
    return res.json({ terminations: rows });
  } catch (err) {
    console.error('adminListTerminations error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN: PROCESS TERMINATION (APPROVE / REJECT)
// PUT /api/admin/terminations/:id
// ══════════════════════════════════════════════════════════
exports.processTermination = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id }                    = req.params;
    const { decision, admin_remarks } = req.body;

    if (!['approved', 'rejected'].includes(decision))
      return res.status(400).json({ message: 'Decision must be "approved" or "rejected".' });

    // Fetch the termination record
    const [tRows] = await conn.query(
      `SELECT t.*, ia.internship_application_id,
              sup_u.email AS supervisor_email,
              sup_u.name  AS supervisor_name,
              u.name      AS student_name,
              v.position_name,
              COALESCE(ip.company_name, pu.name) AS company_name
       FROM internship_terminations t
       JOIN internship_applications ia ON ia.internship_application_id = t.internship_application_id
       JOIN students            s   ON s.student_id  = ia.student_id
       JOIN users               u   ON u.user_id      = s.user_id
       JOIN vacancies           v   ON v.vacancy_id   = ia.vacancy_id
       JOIN industry_partners   ip  ON ip.partner_id  = ia.partner_id
       JOIN users               pu  ON pu.user_id      = ip.user_id
       JOIN industry_supervisors sup ON sup.supervisor_id = t.supervisor_id
       JOIN users               sup_u ON sup_u.user_id = sup.user_id
       WHERE t.termination_id = ?`,
      [id]
    );

    if (tRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Termination request not found.' });
    }

    const t = tRows[0];

    if (t.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ message: `This request is already "${t.status}".` });
    }

    // Update termination status
    await conn.query(
      `UPDATE internship_terminations
       SET status = ?, admin_remarks = ?, updated_at = NOW()
       WHERE termination_id = ?`,
      [decision, admin_remarks?.trim() || null, id]
    );

    // If approved: mark the internship application as terminated
    if (decision === 'approved') {
      await conn.query(
        `UPDATE internship_applications
         SET internship_application_status = 'terminated'
         WHERE internship_application_id = ?`,
        [t.internship_application_id]
      );
    }

    await conn.commit();

    // TODO: send email to supervisor about the decision

    return res.json({ message: `Termination request ${decision}.` });
  } catch (err) {
    await conn.rollback();
    // A1 – error updating
    console.error('processTermination error:', err);
    return res.status(500).json({ message: 'Something went wrong. The status remains unchanged.' });
  } finally {
    conn.release();
  }
};