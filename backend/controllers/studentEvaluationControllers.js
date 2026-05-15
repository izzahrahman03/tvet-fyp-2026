// controllers/studentEvaluationControllers.js
// Student-facing: view their own evaluation (only when submission_confirmed = 1).

const db = require('../database/db');

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
// GET MY EVALUATION   GET /api/student/my-evaluation
// Returns the evaluation only once submission_confirmed = 1.
// ══════════════════════════════════════════════════════════
exports.getMyEvaluation = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);

    // Find the student's accepted internship application
    const [appRows] = await db.query(
      `SELECT
         ia.internship_application_id AS application_id,
         ia.internship_application_status AS status,
         ia.internship_applicant_response AS response,
         v.position_name,
         v.start_date,
         v.end_date,
         COALESCE(ip.company_name, pu.name) AS company_name,
         ip.industry_sector,
         ip.location,
         sup_u.name      AS supervisor_name,
         sup.position    AS supervisor_position,
         sup_u.email     AS supervisor_email,
         sup.phone       AS supervisor_phone
       FROM internship_applications ia
       JOIN vacancies           v   ON v.vacancy_id   = ia.vacancy_id
       JOIN industry_partners   ip  ON ip.partner_id  = ia.partner_id
       JOIN users               pu  ON pu.user_id     = ip.user_id
       LEFT JOIN industry_supervisors sup  ON sup.supervisor_id = ia.supervisor_id
       LEFT JOIN users          sup_u ON sup_u.user_id = sup.user_id
       WHERE ia.student_id = ?
         AND ia.internship_application_status = 'passed'
         AND ia.internship_applicant_response = 'accepted'
       ORDER BY ia.created_at DESC
       LIMIT 1`,
      [studentId]
    );

    if (appRows.length === 0)
      return res.json({ evaluation: null, application: null });

    const application = appRows[0];

    // Fetch evaluation — only expose if supervisor has confirmed submission
    const [evRows] = await db.query(
      `SELECT * FROM internship_evaluations
       WHERE internship_application_id = ?`,
      [application.application_id]
    );

    if (evRows.length === 0 || !evRows[0].submission_confirmed)
      return res.json({ evaluation: null, application });

    return res.json({ evaluation: evRows[0], application });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('getMyEvaluation error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};