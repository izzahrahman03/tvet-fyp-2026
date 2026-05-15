// controllers/adminPlacementControllers.js

const db = require('../database/db');

// ══════════════════════════════════════════════════════════
// LIST PLACEMENTS   GET /api/admin/internship/placements
// Student-centric: every student + their placement status.
// Placement status:
//   placed     — has an accepted internship_applicant_response
//   pending    — has ≥1 active application (pending/interview/passed, no response yet)
//   not_placed — no active or accepted applications
// Supports ?search, ?placement_status, ?intake_id filters.
// ══════════════════════════════════════════════════════════
exports.listPlacements = async (req, res) => {
  try {
    const { search, placement_status, intake_id } = req.query;

    let sql = `
      SELECT
        s.student_id,
        u.name          AS student_name,
        u.email         AS student_email,
        s.matric_number,
        i.intake_name,
        i.intake_id,

        COUNT(ia.internship_application_id) AS total_applications,

        -- Placement status
        CASE
          WHEN SUM(
            CASE WHEN ia.internship_applicant_response = 'accepted' THEN 1 ELSE 0 END
          ) > 0 THEN 'placed'
          WHEN SUM(
            CASE WHEN ia.internship_application_status IN ('pending','interview','passed')
                  AND (ia.internship_applicant_response IS NULL OR ia.internship_applicant_response = 'none')
                 THEN 1 ELSE 0 END
          ) > 0 THEN 'pending'
          ELSE 'not_placed'
        END AS placement_status,

        -- Where placed (if accepted)
        MAX(CASE WHEN ia.internship_applicant_response = 'accepted'
                 THEN COALESCE(ip.company_name, pu.name) END)  AS placed_company,
        MAX(CASE WHEN ia.internship_applicant_response = 'accepted'
                 THEN v.position_name END)                      AS placed_position,
        MAX(CASE WHEN ia.internship_applicant_response = 'accepted'
                 THEN sup_u.name END)                           AS placed_supervisor

      FROM students s
      JOIN users u ON u.user_id = s.user_id
      LEFT JOIN intakes i ON i.intake_id = s.intake_id
      LEFT JOIN internship_applications ia ON ia.student_id = s.student_id
      LEFT JOIN vacancies         v    ON v.vacancy_id     = ia.vacancy_id
      LEFT JOIN industry_partners ip   ON ip.partner_id    = ia.partner_id
      LEFT JOIN users             pu   ON pu.user_id       = ip.user_id
      LEFT JOIN industry_supervisors sup ON sup.supervisor_id = ia.supervisor_id
      LEFT JOIN users             sup_u ON sup_u.user_id   = sup.user_id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (intake_id && intake_id !== 'all') {
      sql += ` AND s.intake_id = ?`;
      params.push(intake_id);
    }

    if (search) {
      sql += ` AND (u.name LIKE ? OR s.matric_number LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY s.student_id`;

    if (placement_status && placement_status !== 'all') {
      sql = `SELECT * FROM (${sql}) AS sub WHERE sub.placement_status = ?`;
      params.push(placement_status);
    }

    sql += ` ORDER BY student_name ASC`;

    const [rows] = await db.query(sql, params);
    return res.json({ placements: rows });

  } catch (err) {
    console.error('listPlacements error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// GET STUDENT APPLICATIONS
// GET /api/admin/internship/placements/:studentId/applications
// Returns all internship applications for one student,
// used in the View modal.
// ══════════════════════════════════════════════════════════
exports.getStudentApplications = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [rows] = await db.query(
      `SELECT
         ia.internship_application_id,
         ia.internship_application_status  AS application_status,
         ia.internship_applicant_response,
         ia.internship_application_date    AS applied_date,
         ia.created_at,
         v.position_name,
         v.start_date,
         v.end_date,
         COALESCE(ip.company_name, pu.name) AS company_name,
         ip.industry_sector,
         ip.location,
         ii.interview_datetime,
         ii.interview_location,
         sup_u.name   AS supervisor_name,
         sup.position AS supervisor_position,
         sup_u.email  AS supervisor_email,
         sup.phone    AS supervisor_phone
       FROM internship_applications ia
       JOIN vacancies         v    ON v.vacancy_id     = ia.vacancy_id
       JOIN industry_partners ip   ON ip.partner_id    = ia.partner_id
       JOIN users             pu   ON pu.user_id       = ip.user_id
       LEFT JOIN internship_interviews ii
         ON ii.internship_application_id = ia.internship_application_id
       LEFT JOIN industry_supervisors sup ON sup.supervisor_id = ia.supervisor_id
       LEFT JOIN users        sup_u ON sup_u.user_id   = sup.user_id
       WHERE ia.student_id = ?
       ORDER BY ia.created_at DESC`,
      [studentId]
    );

    return res.json({ applications: rows });

  } catch (err) {
    console.error('getStudentApplications error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// LIST EVALUATIONS   GET /api/admin/internship/evaluations
// Filters to placed students (internship_applicant_response = 'accepted').
// ══════════════════════════════════════════════════════════
const GRADE_SELECT = `,
  ev.po2_data_handling, ev.po2_dev_tools, ev.po2_debugging,
  ev.po3_issues, ev.po3_ideas, ev.po3_solutions,
  ev.po4_work_relationship, ev.po4_communication,
  ev.po5_attendance, ev.po5_time_management, ev.po5_teamwork,
  ev.po6_ethics, ev.po6_perseverance, ev.po6_independence,
  ev.po7_passion,
  ev.po9_coordination, ev.po9_responsibility, ev.po9_emotion,
  ev.po9_tolerance, ev.po9_decision,
  ev.p10_digital`;

exports.listEvaluations = async (req, res) => {
  try {
    const { search, eval_status } = req.query;

    let sql = `
      SELECT
        ia.internship_application_id  AS id,
        ia.internship_application_status  AS application_status,
        ia.internship_applicant_response,
        ia.internship_application_date    AS applied_date,
        ia.created_at,
        u.name          AS student_name,
        u.email         AS student_email,
        s.matric_number,
        COALESCE(ip.company_name, pu.name) AS company_name,
        ip.industry_sector, ip.location,
        v.position_name, v.start_date, v.end_date,
        sup_u.name   AS supervisor_name,
        sup.position AS supervisor_position,
        sup_u.email  AS supervisor_email,
        sup.phone    AS supervisor_phone,
        ev.evaluation_id,
        ev.total_score,
        ev.submission_confirmed,
        ev.recommend_pass,
        ev.recommend_excellence,
        ev.award_best_intern,
        ev.comments  AS eval_comments,
        ev.updated_at AS evaluated_at
        ${GRADE_SELECT}
      FROM internship_applications ia
      JOIN students            s    ON s.student_id    = ia.student_id
      JOIN users               u    ON u.user_id       = s.user_id
      JOIN vacancies           v    ON v.vacancy_id    = ia.vacancy_id
      JOIN industry_partners   ip   ON ip.partner_id   = ia.partner_id
      JOIN users               pu   ON pu.user_id      = ip.user_id
      LEFT JOIN industry_supervisors sup  ON sup.supervisor_id = ia.supervisor_id
      LEFT JOIN users          sup_u ON sup_u.user_id  = sup.user_id
      LEFT JOIN internship_evaluations ev
        ON ev.internship_application_id = ia.internship_application_id
      WHERE ia.internship_applicant_response = 'accepted'
    `;
    const params = [];

    if (eval_status && eval_status !== 'all') {
      if (eval_status === 'submitted')     sql += ` AND ev.submission_confirmed = 1`;
      if (eval_status === 'in_progress')   sql += ` AND ev.evaluation_id IS NOT NULL AND ev.submission_confirmed = 0`;
      if (eval_status === 'not_evaluated') sql += ` AND ev.evaluation_id IS NULL`;
    }

    if (search) {
      sql += ` AND (u.name LIKE ? OR s.matric_number LIKE ? OR COALESCE(ip.company_name, pu.name) LIKE ? OR v.position_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY ia.created_at DESC`;

    const [rows] = await db.query(sql, params);
    return res.json({ evaluations: rows });

  } catch (err) {
    console.error('listEvaluations error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};