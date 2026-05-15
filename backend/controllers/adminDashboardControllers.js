// controllers/adminDashboardController.js
// Single aggregated endpoint for the admin/manager analytical dashboard.
// Supports optional query params: ?intake=2024A&month=2025-03

const db = require('../database/db');

// ══════════════════════════════════════════════════════════
// GET /api/admin-dashboard
// Query params:
//   intake (string)  – e.g. "2024A"  → filters student-linked queries
// ══════════════════════════════════════════════════════════
exports.getDashboardStats = async (req, res) => {
  try {
    const { intake } = req.query;

    const intakeFilter = intake ? `AND s.intake_id = ${db.escape(intake)}` : '';

    // ── Date-range filter for applications (no intake_id on applications table) ──
    let appDateFilter = '';
    if (intake) {
      const [[intakeRow]] = await db.query(
        `SELECT application_start_date, application_end_date
        FROM intakes WHERE intake_id = ${db.escape(intake)}`
      );
      if (intakeRow?.application_start_date && intakeRow?.application_end_date) {
        appDateFilter = `AND created_at BETWEEN ${db.escape(intakeRow.application_start_date)} AND ${db.escape(intakeRow.application_end_date)}`;
      }
    }
    const [
      // ── Users ───────────────────────────────────────────
      [userCounts],
      [activeUsers],

      // ── Applications ───────────────────────────────────
      [appPipeline],
      [appResponse],
      [slotStats],

      // ── Internship ─────────────────────────────────────
      [placementStats],
      [evalStats],

      // ── Attendance / Leave / Overtime ──────────────────
      [attendanceSummary],
      [leaveSummary],
      [overtimeSummary],

      // ── Trends (last 6 months) ──────────────────────────
      [placementByCompany],
      [userMonthly],
      [appMonthly],
      [attendanceMonthly],

      // ── Meta ────────────────────────────────────────────
      [intakeList],
    ] = await Promise.all([

      // 1. User counts by role (global – not intake/month filtered)
      db.query(`
        SELECT
          SUM(role = 'applicant')           AS applicants,
          SUM(role = 'student')             AS students,
          SUM(role = 'industry_partner')    AS partners,
          SUM(role = 'industry_supervisor') AS supervisors,
          SUM(role = 'interviewer')         AS interviewers,
          SUM(role = 'manager')             AS managers
        FROM users
      `),

      // 2. Active user counts (global)
      db.query(`
        SELECT
          SUM(role = 'student'             AND active_status = 'active') AS active_students,
          SUM(role = 'industry_partner'    AND active_status = 'active') AS active_partners,
          SUM(role = 'industry_supervisor' AND active_status = 'active') AS active_supervisors
        FROM users
      `),

      // 3. Application pipeline – global (not tied to a specific student intake)
      db.query(`
        SELECT
          SUM(application_status = 'submitted') AS submitted,
          SUM(application_status = 'attended')  AS attended,
          SUM(application_status = 'absent')    AS absent,
          SUM(application_status = 'passed')    AS passed,
          SUM(application_status = 'failed')    AS failed,
          COUNT(*)                               AS total
        FROM applications
        WHERE application_status != 'draft' ${appDateFilter}
      `),

      // 4. Applicant response (global)
      db.query(`
        SELECT
          SUM(applicant_response = 'accepted')  AS accepted,
          SUM(applicant_response = 'rejected')  AS rejected,
          SUM(applicant_response = 'withdrawn') AS withdrawn
        FROM applications
        WHERE application_status != 'draft' ${appDateFilter}
      `),

      // 5. Interview slot utilisation (global)
      db.query(`
        SELECT
          COUNT(*) AS total_slots,
          SUM(capacity) AS total_capacity,
          (SELECT COUNT(*) FROM applications
           WHERE interview_slot_id IS NOT NULL
             AND application_status NOT IN ('draft')) AS total_booked
        FROM interview_slots
      `),

      // 6. Internship placement overview — filtered by intake
      db.query(`
        SELECT
          SUM(CASE WHEN placed.student_id IS NOT NULL THEN 1 ELSE 0 END) AS placed,
          SUM(CASE WHEN active_app.student_id IS NOT NULL AND placed.student_id IS NULL THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN placed.student_id IS NULL AND active_app.student_id IS NULL THEN 1 ELSE 0 END) AS not_placed,
          COUNT(*) AS total_students
        FROM students s
        JOIN users u ON u.user_id = s.user_id AND u.active_status = 'active'
        LEFT JOIN (
          SELECT DISTINCT student_id FROM internship_applications
          WHERE internship_applicant_response = 'accepted'
        ) placed ON placed.student_id = s.student_id
        LEFT JOIN (
          SELECT DISTINCT student_id FROM internship_applications
          WHERE internship_application_status IN ('pending','interview','passed')
            AND (internship_applicant_response IS NULL OR internship_applicant_response = 'none')
        ) active_app ON active_app.student_id = s.student_id
        WHERE 1=1 ${intakeFilter}
      `),

      // 7. Internship evaluation status — filtered by intake
      db.query(`
        SELECT
          SUM(ev.submission_confirmed = 1)                                  AS submitted,
          SUM(ev.evaluation_id IS NOT NULL AND ev.submission_confirmed = 0) AS in_progress,
          SUM(ev.evaluation_id IS NULL)                                     AS not_evaluated,
          ROUND(AVG(ev.total_score), 1)                                     AS avg_score,
          COUNT(ia.internship_application_id)                               AS total_placed
        FROM internship_applications ia
        JOIN students s ON s.student_id = ia.student_id
        JOIN users u ON u.user_id = s.user_id
        LEFT JOIN internship_evaluations ev
          ON ev.internship_application_id = ia.internship_application_id
        WHERE ia.internship_applicant_response = 'accepted' ${intakeFilter}
      `),

      // 8. Attendance summary — filtered by intake + month
      db.query(`
        SELECT
          SUM(ar.status = 'present')           AS present,
          SUM(ar.status = 'absent')            AS absent,
          SUM(ar.status = 'pending')           AS pending,
          SUM(ar.clock_out IS NOT NULL)        AS has_clockout,
          COUNT(*)                             AS total
        FROM attendance_records ar
        JOIN students s ON s.student_id = ar.student_id
        WHERE 1=1 ${intakeFilter}
      `),

      // 9. Leave request summary — filtered by month
      db.query(`
        SELECT
          SUM(status = 'pending')  AS pending,
          SUM(status = 'approved') AS approved,
          SUM(status = 'rejected') AS rejected,
          COUNT(*)                  AS total
        FROM leave_requests
        WHERE 1=1
      `),

      // 10. Overtime request summary — filtered by month
      db.query(`
        SELECT
          SUM(status = 'pending')  AS pending,
          SUM(status = 'approved') AS approved,
          SUM(status = 'rejected') AS rejected,
          COUNT(*)                  AS total
        FROM overtime_requests
        WHERE 1=1
      `),

      // 11. Placement by company (top 10) — filtered by intake
      db.query(`
        SELECT
          COALESCE(ip.company_name, pu.name) AS company_name,
          COUNT(*)                            AS student_count
        FROM internship_applications ia
        JOIN industry_partners ip ON ip.partner_id = ia.partner_id
        JOIN users             pu ON pu.user_id     = ip.user_id
        JOIN students           s ON s.student_id   = ia.student_id
        WHERE ia.internship_applicant_response = 'accepted' ${intakeFilter}
        GROUP BY ia.partner_id, company_name
        ORDER BY student_count DESC
        LIMIT 10
      `),

      // 12. Monthly user registrations (last 6 months) — global trend, not filtered
      db.query(`
        SELECT
          DATE_FORMAT(created_at, '%b')           AS month,
          DATE_FORMAT(created_at, '%Y-%m')        AS month_key,
          SUM(role = 'applicant')                 AS applicants,
          SUM(role = 'student')                   AS students,
          SUM(role = 'industry_partner')          AS partners
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month_key, month
        ORDER BY month_key ASC
      `),

      // 13. Monthly application submissions (last 6 months) — global trend
      db.query(`
        SELECT
          DATE_FORMAT(created_at, '%b')        AS month,
          DATE_FORMAT(created_at, '%Y-%m')     AS month_key,
          COUNT(*)                              AS total_applications
        FROM applications
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          AND application_status != 'draft'
          ${appDateFilter}
        GROUP BY month_key, month
        ORDER BY month_key ASC
      `),

      // 14. Monthly attendance trend (last 6 months) — filtered by intake if provided
      db.query(`
        SELECT
          DATE_FORMAT(ar.attendance_date, '%b')     AS month,
          DATE_FORMAT(ar.attendance_date, '%Y-%m')  AS month_key,
          SUM(ar.status = 'present')                AS present,
          SUM(ar.status = 'absent')                 AS absent,
          SUM(ar.status = 'pending')                AS pending,
          COUNT(*)                                  AS total
        FROM attendance_records ar
        JOIN students s ON s.student_id = ar.student_id
        WHERE ar.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          ${intakeFilter}
        GROUP BY month_key, month
        ORDER BY month_key ASC
      `),

      // 15. Available intakes for dropdown
      db.query(`
        SELECT intake_id, intake_name
        FROM intakes
        ORDER BY intake_name DESC
      `),
    ]);

    const u  = userCounts[0]        || {};
    const a  = activeUsers[0]       || {};
    const ap = appPipeline[0]       || {};
    const ar = appResponse[0]       || {};
    const sl = slotStats[0]         || {};
    const pl = placementStats[0]    || {};
    const ev = evalStats[0]         || {};
    const at = attendanceSummary[0] || {};
    const lv = leaveSummary[0]      || {};
    const ot = overtimeSummary[0]   || {};

    return res.json({
      users: {
        counts: {
          applicants:   +u.applicants   || 0,
          students:     +u.students     || 0,
          partners:     +u.partners     || 0,
          supervisors:  +u.supervisors  || 0,
          interviewers: +u.interviewers || 0,
          managers:     +u.managers     || 0,
        },
        active: {
          students:    +a.active_students    || 0,
          partners:    +a.active_partners    || 0,
          supervisors: +a.active_supervisors || 0,
        },
        monthly: userMonthly,
      },
      applications: {
        pipeline: {
          submitted: +ap.submitted || 0,
          attended:  +ap.attended  || 0,
          absent:    +ap.absent    || 0,
          passed:    +ap.passed    || 0,
          failed:    +ap.failed    || 0,
          total:     +ap.total     || 0,
        },
        response: {
          accepted:  +ar.accepted  || 0,
          rejected:  +ar.rejected  || 0,
          withdrawn: +ar.withdrawn || 0,
        },
        slots: {
          total:    +sl.total_slots    || 0,
          capacity: +sl.total_capacity || 0,
          booked:   +sl.total_booked   || 0,
        },
        monthly: appMonthly,
      },
      internship: {
        placement: {
          placed:     +pl.placed         || 0,
          pending:    +pl.pending        || 0,
          not_placed: +pl.not_placed     || 0,
          total:      +pl.total_students || 0,
        },
        evaluation: {
          submitted:     +ev.submitted      || 0,
          in_progress:   +ev.in_progress    || 0,
          not_evaluated: +ev.not_evaluated  || 0,
          avg_score:     +ev.avg_score      || 0,
          total:         +ev.total_placed   || 0,
        },
        placementByCompany: placementByCompany,
      },
      attendance: {
        summary: {
          present: +at.present || 0,
          absent:  +at.absent  || 0,
          pending: +at.pending || 0,
          total:   +at.total   || 0,
        },
        leave: {
          pending:  +lv.pending  || 0,
          approved: +lv.approved || 0,
          rejected: +lv.rejected || 0,
          total:    +lv.total    || 0,
        },
        overtime: {
          pending:  +ot.pending  || 0,
          approved: +ot.approved || 0,
          rejected: +ot.rejected || 0,
          total:    +ot.total    || 0,
        },
        monthly: attendanceMonthly,
      },
      // Active filters echoed back so the frontend can sync state on reload
      activeFilters: {
        intake: intake || null,
      },
      // Available intake options for the dropdown
      meta: {
        intakes: intakeList.map((r) => ({ intake_id: r.intake_id, intake_name: r.intake_name })),
      },
    });

  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};