// controllers/supervisorEvaluationControllers.js
// Industry supervisor: view assigned students + manage evaluations.

const db = require('../database/db');

// ── Grade → score ratio ────────────────────────────────────
const GRADE_RATIO = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.2 };

// Max score per criterion (must match frontend CRITERIA_MAX)
const CRITERIA_MAX = {
  po2_data_handling:    5,
  po2_dev_tools:        5,
  po2_debugging:        5,
  po3_issues:           5,
  po3_ideas:            5,
  po3_solutions:        5,
  po4_work_relationship:10,
  po4_communication:    5,
  po5_attendance:       5,
  po5_time_management:  5,
  po5_teamwork:         5,
  po6_ethics:           5,
  po6_perseverance:     5,
  po6_independence:     5,
  po7_passion:         10,
  po9_coordination:     2,
  po9_responsibility:   2,
  po9_emotion:          2,
  po9_tolerance:        2,
  po9_decision:         2,
  p10_digital:          5,
};

function computeTotal(body) {
  let total = 0;
  for (const [key, max] of Object.entries(CRITERIA_MAX)) {
    const grade = body[key];
    if (grade && GRADE_RATIO[grade] !== undefined) {
      total += GRADE_RATIO[grade] * max;
    }
  }
  return parseFloat(total.toFixed(2));
}

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
// LIST ASSIGNED STUDENTS   GET /api/supervisor/students
// Returns all accepted applications assigned to this supervisor.
// ══════════════════════════════════════════════════════════
exports.listAssignedStudents = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);

    const [rows] = await db.query(
  `SELECT
     ia.internship_application_id AS application_id,
     u.name          AS student_name,
     u.email         AS student_email,
     s.matric_number,
     v.position_name,
     COALESCE(ip.company_name, pu.name) AS company_name,
     ip.location,
     v.start_date,
     v.end_date,
     sup_u.name      AS external_supervisor_name,
     sup_ext.position AS external_supervisor_position,
     ev.evaluation_id,
     ev.total_score,
     ev.submission_confirmed,
     ev.updated_at   AS evaluated_at
   FROM internship_applications ia
   JOIN students            s       ON s.student_id      = ia.student_id
   JOIN users               u       ON u.user_id          = s.user_id
   JOIN vacancies           v       ON v.vacancy_id       = ia.vacancy_id
   JOIN industry_partners   ip      ON ip.partner_id      = ia.partner_id
   JOIN users               pu      ON pu.user_id         = ip.user_id
   JOIN industry_supervisors sup_ext ON sup_ext.supervisor_id = ia.supervisor_id
   JOIN users               sup_u   ON sup_u.user_id      = sup_ext.user_id
   LEFT JOIN internship_evaluations ev
     ON ev.internship_application_id = ia.internship_application_id
   WHERE ia.supervisor_id = ?
     AND ia.internship_application_status = 'passed'
     AND ia.internship_applicant_response = 'accepted'
   ORDER BY u.name ASC`,
  [supervisorId]
);
    return res.json({ students: rows });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('listAssignedStudents error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// GET EVALUATION   GET /api/supervisor/evaluations/:applicationId
// ══════════════════════════════════════════════════════════
exports.getEvaluation = async (req, res) => {
  try {
    const supervisorId    = await getSupervisorId(req.user.id);
    const { applicationId } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM internship_evaluations
       WHERE internship_application_id = ? AND supervisor_id = ?`,
      [applicationId, supervisorId]
    );

    return res.json({ evaluation: rows[0] ?? null });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('getEvaluation error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// SAVE EVALUATION   POST /api/supervisor/evaluations
// Creates or updates (upsert) the evaluation for an application.
// ══════════════════════════════════════════════════════════
exports.saveEvaluation = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    const body         = req.body;
    const { internship_application_id } = body;

    if (!internship_application_id)
      return res.status(400).json({ message: 'internship_application_id is required.' });

    // Confirm the application is assigned to this supervisor
    const [appRows] = await db.query(
      `SELECT internship_application_id
       FROM internship_applications
       WHERE internship_application_id = ?
         AND supervisor_id = ?
         AND internship_application_status = 'passed'
         AND internship_applicant_response = 'accepted'`,
      [internship_application_id, supervisorId]
    );
    if (appRows.length === 0)
      return res.status(403).json({ message: 'Application not found or not assigned to you.' });

    const total = computeTotal(body);

    const fields = {
      internship_application_id,
      supervisor_id:            supervisorId,
      comments:                 body.comments                 ?? null,
      recommend_pass:           body.recommend_pass           ? 1 : 0,
      recommend_excellence:     body.recommend_excellence     ? 1 : 0,
      award_best_intern:        body.award_best_intern        ? 1 : 0,
      submission_confirmed:     body.submission_confirmed     ? 1 : 0,
      po2_data_handling:        body.po2_data_handling        ?? null,
      po2_dev_tools:            body.po2_dev_tools            ?? null,
      po2_debugging:            body.po2_debugging            ?? null,
      po3_issues:               body.po3_issues               ?? null,
      po3_ideas:                body.po3_ideas                ?? null,
      po3_solutions:            body.po3_solutions            ?? null,
      po4_work_relationship:    body.po4_work_relationship    ?? null,
      po4_communication:        body.po4_communication        ?? null,
      po5_attendance:           body.po5_attendance           ?? null,
      po5_time_management:      body.po5_time_management      ?? null,
      po5_teamwork:             body.po5_teamwork             ?? null,
      po6_ethics:               body.po6_ethics               ?? null,
      po6_perseverance:         body.po6_perseverance         ?? null,
      po6_independence:         body.po6_independence         ?? null,
      po7_passion:              body.po7_passion              ?? null,
      po9_coordination:         body.po9_coordination         ?? null,
      po9_responsibility:       body.po9_responsibility       ?? null,
      po9_emotion:              body.po9_emotion              ?? null,
      po9_tolerance:            body.po9_tolerance            ?? null,
      po9_decision:             body.po9_decision             ?? null,
      p10_digital:              body.p10_digital              ?? null,
      total_score:              total,
    };

    await db.query(
      `INSERT INTO internship_evaluations SET ?
       ON DUPLICATE KEY UPDATE
         comments               = VALUES(comments),
         recommend_pass         = VALUES(recommend_pass),
         recommend_excellence   = VALUES(recommend_excellence),
         award_best_intern      = VALUES(award_best_intern),
         submission_confirmed   = VALUES(submission_confirmed),
         po2_data_handling      = VALUES(po2_data_handling),
         po2_dev_tools          = VALUES(po2_dev_tools),
         po2_debugging          = VALUES(po2_debugging),
         po3_issues             = VALUES(po3_issues),
         po3_ideas              = VALUES(po3_ideas),
         po3_solutions          = VALUES(po3_solutions),
         po4_work_relationship  = VALUES(po4_work_relationship),
         po4_communication      = VALUES(po4_communication),
         po5_attendance         = VALUES(po5_attendance),
         po5_time_management    = VALUES(po5_time_management),
         po5_teamwork           = VALUES(po5_teamwork),
         po6_ethics             = VALUES(po6_ethics),
         po6_perseverance       = VALUES(po6_perseverance),
         po6_independence       = VALUES(po6_independence),
         po7_passion            = VALUES(po7_passion),
         po9_coordination       = VALUES(po9_coordination),
         po9_responsibility     = VALUES(po9_responsibility),
         po9_emotion            = VALUES(po9_emotion),
         po9_tolerance          = VALUES(po9_tolerance),
         po9_decision           = VALUES(po9_decision),
         p10_digital            = VALUES(p10_digital),
         total_score            = VALUES(total_score),
         updated_at             = NOW()`,
      [fields]
    );

    return res.json({ message: 'Evaluation saved successfully.', total_score: total });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('saveEvaluation error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// DELETE EVALUATION   DELETE /api/supervisor/evaluations/:applicationId
// ══════════════════════════════════════════════════════════
exports.deleteEvaluation = async (req, res) => {
  try {
    const supervisorId      = await getSupervisorId(req.user.id);
    const { applicationId } = req.params;

    const [result] = await db.query(
      `DELETE FROM internship_evaluations
       WHERE internship_application_id = ? AND supervisor_id = ?`,
      [applicationId, supervisorId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Evaluation not found.' });

    return res.json({ message: 'Evaluation deleted successfully.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('deleteEvaluation error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};