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
        ia.internship_application_status AS application_status,
        ia.internship_applicant_response,
        ia.internship_application_date   AS applied_date,
        ia.resume_path,
        ia.cover_letter_path,
        ia.supervisor_id,
        ia.created_at,
        u.name  AS student_name,
        u.email AS student_email,
        v.position_name,
        intk.intake_name,
        ii.interview_datetime,
        ii.interview_location,
        sup_u.name    AS supervisor_name,
        sup.position  AS supervisor_position,
        sup.phone     AS supervisor_phone,
        sup_u.email   AS supervisor_email
      FROM internship_applications ia
      JOIN students  s  ON s.student_id = ia.student_id
      JOIN intakes   intk ON intk.intake_id = s.intake_id
      JOIN users     u  ON u.user_id    = s.user_id
      JOIN vacancies v  ON v.vacancy_id = ia.vacancy_id
      LEFT JOIN internship_interviews ii
        ON ii.internship_application_id = ia.internship_application_id
      LEFT JOIN industry_supervisors sup
        ON sup.supervisor_id = ia.supervisor_id
      LEFT JOIN users sup_u
        ON sup_u.user_id = sup.user_id
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

    const TRANSITIONS = {
      pending:   ['interview', 'rejected'],
      interview: ['passed', 'failed'],
    };

    // ── 1. Fetch first ──────────────────────────────────────
    const [rows] = await conn.query(
      `SELECT
         ia.internship_application_id,
         ia.internship_application_status AS current_status,
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

    const app = rows[0]; // ← app is now defined

    // ── 2. Validate transition ──────────────────────────────
    const allowed = TRANSITIONS[app.current_status];
    if (!allowed) {
      await conn.rollback();
      return res.status(400).json({ message: `Status "${app.current_status}" cannot be updated.` });
    }
    if (!status || !allowed.includes(status.toLowerCase())) {
      await conn.rollback();
      return res.status(400).json({
        message: `From "${app.current_status}", status must be one of: ${allowed.join(', ')}.`,
      });
    }

    if (status === 'interview') {
      if (!interview_datetime) {
        await conn.rollback();
        return res.status(400).json({ message: 'Interview date & time is required.' });
      }
      if (!interview_location?.trim()) {
        await conn.rollback();
        return res.status(400).json({ message: 'Interview location is required.' });
      }
    }

    // ── 3. Update ───────────────────────────────────────────
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
// ══════════════════════════════════════════════════════════
exports.approveWithdraw = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const partnerId = await getPartnerIdFromUser(req.user.id);
    const { id }    = req.params;

    const [appRows] = await conn.query(
      `SELECT
         ia.internship_application_status AS application_status,
         ia.internship_applicant_response AS response,
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
    if (appRows[0].response !== 'withdrawn_requested') {
      await conn.rollback();
      return res.status(400).json({ message: 'Application is not pending withdrawal approval.' });
    }

    await conn.query(
      `UPDATE internship_applications
       SET internship_applicant_response = 'withdrawn'
       WHERE internship_application_id = ?`,
      [id]
    );

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


// ══════════════════════════════════════════════════════════
// LIST SUPERVISORS   GET /api/partner/supervisors
// ══════════════════════════════════════════════════════════
exports.listSupervisors = async (req, res) => {
  try {
    const partnerId = await getPartnerIdFromUser(req.user.id);

    const [rows] = await db.query(
      `SELECT
         sup.supervisor_id,
         sup.position,
         sup.phone,
         u.name  AS supervisor_name,
         u.email AS supervisor_email
       FROM industry_supervisors sup
       JOIN users u ON u.user_id = sup.user_id
       WHERE sup.partner_id = ?
       ORDER BY u.name ASC`,
      [partnerId]
    );

    return res.json({ supervisors: rows });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('listSupervisors error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ASSIGN SUPERVISOR (SINGLE)
// PUT /api/partner/internship-applications/:id/assign-supervisor
// Only allowed when application status = 'accepted'.
// ══════════════════════════════════════════════════════════
exports.assignSupervisor = async (req, res) => {
  try {
    const partnerId        = await getPartnerIdFromUser(req.user.id);
    const { id }           = req.params;
    const { supervisor_id } = req.body;

    if (!supervisor_id)
      return res.status(400).json({ message: 'supervisor_id is required.' });

    const [appRows] = await db.query(
      `SELECT internship_application_status AS application_status,
       internship_applicant_response,
       intern_status
       FROM internship_applications
       WHERE internship_application_id = ? AND partner_id = ?`,
      [id, partnerId]
    );
    if (appRows.length === 0)
      return res.status(404).json({ message: 'Application not found.' });
    if (appRows[0].intern_status === 'terminated')
      return res.status(400).json({ message: 'Cannot assign supervisor to a terminated intern.' });
    if (appRows[0].intern_status !== 'active')
      return res.status(400).json({ message: 'Supervisor can only be assigned to an active intern.' });

    // Confirm supervisor belongs to this partner
    const [supRows] = await db.query(
      `SELECT supervisor_id FROM industry_supervisors
       WHERE supervisor_id = ? AND partner_id = ?`,
      [supervisor_id, partnerId]
    );
    if (supRows.length === 0)
      return res.status(403).json({ message: 'Supervisor not found under your company.' });

    await db.query(
      `UPDATE internship_applications SET supervisor_id = ?
       WHERE internship_application_id = ?`,
      [supervisor_id, id]
    );

    return res.json({ message: 'Supervisor assigned successfully.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('assignSupervisor error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// BULK ASSIGN SUPERVISOR
// PUT /api/partner/internship-applications/bulk-assign-supervisor
// Assigns the same supervisor to multiple accepted applications.
// ══════════════════════════════════════════════════════════
exports.bulkAssignSupervisor = async (req, res) => {
  try {
    const partnerId                          = await getPartnerIdFromUser(req.user.id);
    const { application_ids, supervisor_id } = req.body;

    if (!Array.isArray(application_ids) || application_ids.length === 0)
      return res.status(400).json({ message: 'application_ids must be a non-empty array.' });
    if (!supervisor_id)
      return res.status(400).json({ message: 'supervisor_id is required.' });

    // Confirm supervisor belongs to this partner
    const [supRows] = await db.query(
      `SELECT supervisor_id FROM industry_supervisors
       WHERE supervisor_id = ? AND partner_id = ?`,
      [supervisor_id, partnerId]
    );
    if (supRows.length === 0)
      return res.status(403).json({ message: 'Supervisor not found under your company.' });

    // Only update ACCEPTED applications belonging to this partner
    const [result] = await db.query(
      `UPDATE internship_applications
       SET supervisor_id = ?
       WHERE internship_application_id IN (?)
         AND partner_id = ?
         AND internship_applicant_response = 'accepted'
         AND intern_status = 'active'`,
      [supervisor_id, application_ids, partnerId]
    );

    return res.json({
      message: `Supervisor assigned to ${result.affectedRows} student(s).`,
      affected: result.affectedRows,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('bulkAssignSupervisor error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ══════════════════════════════════════════════════════════
// LIST INTERNS   GET /api/partner/interns
// Returns all applications where internship_applicant_response = 'accepted'
// with their intern_status (active / inactive / terminated)
// ══════════════════════════════════════════════════════════
exports.listInterns = async (req, res) => {
  try {
    const partnerId = await getPartnerIdFromUser(req.user.id);
 
    const [rows] = await db.query(
      `SELECT
         ia.internship_application_id  AS id,
         ia.student_id,
         ia.vacancy_id,
         ia.internship_application_status AS application_status,
         ia.internship_applicant_response,
         ia.internship_application_date   AS applied_date,
         ia.intern_status,
         ia.intern_remarks,
         ia.intern_status_updated_at      AS accepted_date,
         ia.supervisor_id,
         u.name   AS student_name,
         u.email  AS student_email,
         v.position_name,
         s.intake_id,
         intk.intake_name,
         sup_u.name    AS supervisor_name,
         sup.position  AS supervisor_position,
         sup.phone     AS supervisor_phone,
         sup_u.email   AS supervisor_email
       FROM internship_applications ia
       JOIN students  s    ON s.student_id   = ia.student_id
       JOIN intakes   intk ON intk.intake_id  = s.intake_id
       JOIN users     u    ON u.user_id       = s.user_id
       JOIN vacancies v    ON v.vacancy_id    = ia.vacancy_id
       LEFT JOIN industry_supervisors sup
         ON sup.supervisor_id = ia.supervisor_id
       LEFT JOIN users sup_u
         ON sup_u.user_id = sup.user_id
       WHERE ia.partner_id = ?
         AND ia.internship_applicant_response = 'accepted'
       ORDER BY ia.internship_application_date DESC`,
      [partnerId]
    );
 
    return res.json({ interns: rows });
 
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('listInterns error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};
 
 
// ══════════════════════════════════════════════════════════
// UPDATE INTERN STATUS   PUT /api/partner/interns/:id/status
// Allowed transitions:
//   active   → inactive | terminated
//   inactive → active   | terminated
//   terminated → (locked, no transitions)
// ══════════════════════════════════════════════════════════
exports.updateInternStatus = async (req, res) => {
  try {
    const partnerId              = await getPartnerIdFromUser(req.user.id);
    const { id }                 = req.params;
    const { intern_status, remarks } = req.body;
 
    const VALID_STATUSES = ['active', 'inactive', 'terminated'];
    const TRANSITIONS    = {
      null:     ['active',   'inactive', 'terminated'],
      active:   ['inactive', 'terminated'],
      inactive: ['active',   'terminated'],
    };
 
    if (!intern_status || !VALID_STATUSES.includes(intern_status.toLowerCase())) {
      return res.status(400).json({
        message: `intern_status must be one of: ${VALID_STATUSES.join(', ')}.`,
      });
    }
 
    if (intern_status === 'terminated' && !remarks?.trim()) {
      return res.status(400).json({ message: 'Reason for termination is required.' });
    }
 
    // Verify ownership + current status
    const [rows] = await db.query(
      `SELECT
         ia.intern_status                 AS current_intern_status,
         ia.internship_applicant_response AS response,
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
 
    if (rows.length === 0)
      return res.status(404).json({ message: 'Intern not found.' });
 
    const intern = rows[0];
 
    if (intern.response !== 'accepted')
      return res.status(400).json({ message: 'Only accepted interns can have their status updated.' });
 
    const current = intern.current_intern_status?.toLowerCase() ?? null;
 
    if (current === 'terminated')
      return res.status(400).json({ message: 'Terminated intern status cannot be changed.' });
 
    const allowed = TRANSITIONS[current] ?? [];
    if (!allowed.includes(intern_status.toLowerCase())) {
      return res.status(400).json({
        message: `From "${current}", intern_status must be one of: ${allowed.join(', ')}.`,
      });
    }
 
    await db.query(
      `UPDATE internship_applications
       SET intern_status            = ?,
           intern_remarks           = ?,
           intern_status_updated_at = NOW()
       WHERE internship_application_id = ?`,
      [intern_status.toLowerCase(), remarks?.trim() ?? null, id]
    );
 
    // Optionally notify student via email
    // sendInternshipStatusEmail(intern.student_email, intern.student_name, intern.position_name, intern.company_name, `intern_${intern_status.toLowerCase()}`);
 
    return res.json({ message: `Intern status updated to "${intern_status}".` });
 
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('updateInternStatus error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};