// controllers/internshipActivityControllers.js
// Handles Leave Requests, Overtime Requests, and Attendance Records.

const db   = require('../database/db');
const path = require('path');
const fs   = require('fs');
const multer = require('multer');

// ── Multer for leave documents ────────────────────────────
const LEAVE_DOCS_DIR = path.join(__dirname, '..', 'uploads', 'leave_docs');
if (!fs.existsSync(LEAVE_DOCS_DIR)) fs.mkdirSync(LEAVE_DOCS_DIR, { recursive: true });

const leaveStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LEAVE_DOCS_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `leave_${req.user.id}_${Date.now()}${ext}`);
  },
});
const leaveFileFilter = (_req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  allowed.includes(path.extname(file.originalname).toLowerCase())
    ? cb(null, true)
    : cb(new Error('Only PDF and image files are allowed.'));
};
exports.uploadLeaveDoc = multer({
  storage: leaveStorage, fileFilter: leaveFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('document');

// ── Helpers ───────────────────────────────────────────────
async function getStudentId(userId) {
  const [rows] = await db.query('SELECT student_id FROM students WHERE user_id = ?', [userId]);
  if (!rows.length) throw { status: 403, message: 'No student profile found.' };
  return rows[0].student_id;
}

async function getSupervisorId(userId) {
  const [rows] = await db.query('SELECT supervisor_id FROM industry_supervisors WHERE user_id = ?', [userId]);
  if (!rows.length) throw { status: 403, message: 'No supervisor profile found.' };
  return rows[0].supervisor_id;
}

async function getStudentSupervisor(studentId) {
  const [rows] = await db.query(
    `SELECT ia.supervisor_id FROM internship_applications ia
     WHERE ia.student_id = ? AND ia.internship_application_status = 'passed' AND ia.internship_applicant_response = 'accepted'
     ORDER BY ia.created_at DESC LIMIT 1`,
    [studentId]
  );
  if (!rows.length) throw { status: 400, message: 'No active internship found. You must be assigned to a supervisor.' };
  return rows[0].supervisor_id;
}

function handleErr(err, res) {
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
}

// GET /api/student/profile-info
exports.getStudentProfileInfo = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    const [rows] = await db.query(
    `SELECT u.name, u.email, s.matric_number, a.ic_number
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    LEFT JOIN applications a ON a.user_id = s.user_id
    WHERE s.student_id = ?
    LIMIT 1`,
    [studentId]
  );
    if (!rows.length) return res.status(404).json({ message: "Student profile not found." });
    return res.json(rows[0]);
  } catch (err) { return handleErr(err, res); }
};

// ══════════════════════════════════════════════════════════
// LEAVE REQUESTS
// ══════════════════════════════════════════════════════════

// POST /api/student/leave-requests
exports.submitLeave = async (req, res) => {
  try {
    const studentId    = await getStudentId(req.user.id);
    const supervisorId = await getStudentSupervisor(studentId);

    const {
      leave_type,
      duration_type,  // 'full_day' | 'half_day'
      start_date,     // full_day: start; half_day: used as leave_date
      end_date,       // full_day: end;   half_day: same as start_date
      session,        // half_day only: 'AM' | 'PM'
      reason,
    } = req.body;

    // ── Validate required fields ─────────────────────────
    if (!leave_type || !duration_type || !reason?.trim())
      return res.status(400).json({ message: 'Leave type, duration type, and reason are required.' });

    if (!['annual', 'medical', 'unpaid'].includes(leave_type))
      return res.status(400).json({ message: 'Invalid leave type.' });

    if (!['full_day', 'half_day'].includes(duration_type))
      return res.status(400).json({ message: 'Invalid duration type.' });

    let resolvedStartDate, resolvedEndDate, resolvedSession = null;

    if (duration_type === 'full_day') {
      if (!start_date || !end_date)
        return res.status(400).json({ message: 'Start date and end date are required for full day leave.' });
      if (new Date(start_date) > new Date(end_date))
        return res.status(400).json({ message: 'Start date cannot be after end date.' });
      resolvedStartDate = start_date;
      resolvedEndDate   = end_date;
    } else {
      // half_day — leave_date sent as start_date from frontend
      if (!start_date)
        return res.status(400).json({ message: 'Leave date is required for half day leave.' });
      if (!session || !['AM', 'PM'].includes(session))
        return res.status(400).json({ message: 'Session (AM or PM) is required for half day leave.' });
      resolvedStartDate = start_date;
      resolvedEndDate   = start_date; // same day
      resolvedSession   = session;
    }

    const documentPath = req.file?.filename || null;

    await db.query(
      `INSERT INTO leave_requests
         (student_id, supervisor_id, duration_type, leave_type,
          start_date, end_date, session, reason, document_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId, supervisorId, duration_type, leave_type,
        resolvedStartDate, resolvedEndDate, resolvedSession,
        reason.trim(), documentPath,
      ]
    );
    return res.status(201).json({ message: 'Leave request submitted successfully.' });
  } catch (err) { return handleErr(err, res); }
};

// GET /api/student/leave-requests
exports.myLeaveRequests = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    const [rows] = await db.query(
      `SELECT lr.*, su.name AS supervisor_name
       FROM leave_requests lr
       JOIN industry_supervisors isup ON isup.supervisor_id = lr.supervisor_id
       JOIN users su ON su.user_id = isup.user_id
       WHERE lr.student_id = ?
       ORDER BY lr.created_at DESC`,
      [studentId]
    );
    return res.json({ leave_requests: rows });
  } catch (err) { return handleErr(err, res); }
};

// GET /api/supervisor/leave-requests
exports.supervisorLeaveRequests = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    const [rows] = await db.query(
      `SELECT lr.*,
              u.name         AS student_name,
              u.email        AS student_email,
              s.matric_number
       FROM leave_requests lr
       JOIN students s ON s.student_id = lr.student_id
       JOIN users    u ON u.user_id     = s.user_id
       WHERE lr.supervisor_id = ?
       ORDER BY lr.created_at DESC`,
      [supervisorId]
    );
    return res.json({ leave_requests: rows });
  } catch (err) { return handleErr(err, res); }
};

// PUT /api/supervisor/leave-requests/:id
exports.processLeave = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    const { id }       = req.params;
    const { status, supervisor_remarks } = req.body;

    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be approved or rejected.' });

    const [rows] = await db.query(
      'SELECT status FROM leave_requests WHERE leave_id = ? AND supervisor_id = ?',
      [id, supervisorId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Leave request not found.' });
    if (rows[0].status !== 'pending')
      return res.status(400).json({ message: 'Only pending requests can be processed.' });

    await db.query(
      'UPDATE leave_requests SET status = ?, supervisor_remarks = ?, updated_at = NOW() WHERE leave_id = ?',
      [status, supervisor_remarks?.trim() || null, id]
    );
    return res.json({ message: `Leave request ${status}.` });
  } catch (err) { return handleErr(err, res); }
};

exports.downloadLeaveDocument = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT document_path FROM leave_requests WHERE leave_id = ?', [req.params.id]);
    if (!rows.length || !rows[0].document_path) return res.status(404).json({ message: 'No document found.' });
    const filePath = path.join(LEAVE_DOCS_DIR, rows[0].document_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found on server.' });
    res.download(filePath);
  } catch (err) { return handleErr(err, res); }
};

// ══════════════════════════════════════════════════════════
// OVERTIME REQUESTS
// ══════════════════════════════════════════════════════════

// POST /api/student/overtime-requests
exports.submitOvertime = async (req, res) => {
  try {
    const studentId    = await getStudentId(req.user.id);
    const supervisorId = await getStudentSupervisor(studentId);
    const { overtime_date, start_time, end_time, reason } = req.body;

    if (!overtime_date || !start_time || !end_time || !reason?.trim())
      return res.status(400).json({ message: 'All fields are required.' });
    if (start_time >= end_time)
      return res.status(400).json({ message: 'End time must be after start time.' });

    await db.query(
      `INSERT INTO overtime_requests
         (student_id, supervisor_id, overtime_date, start_time, end_time, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, supervisorId, overtime_date, start_time, end_time, reason.trim()]
    );
    return res.status(201).json({ message: 'Overtime request submitted successfully.' });
  } catch (err) { return handleErr(err, res); }
};

// GET /api/student/overtime-requests
exports.myOvertimeRequests = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    const [rows] = await db.query(
      `SELECT otr.*, su.name AS supervisor_name
       FROM overtime_requests otr
       JOIN industry_supervisors isup ON isup.supervisor_id = otr.supervisor_id
       JOIN users su ON su.user_id = isup.user_id
       WHERE otr.student_id = ?
       ORDER BY otr.created_at DESC`,
      [studentId]
    );
    return res.json({ overtime_requests: rows });
  } catch (err) { return handleErr(err, res); }
};

// GET /api/supervisor/overtime-requests
exports.supervisorOvertimeRequests = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    const [rows] = await db.query(
      `SELECT otr.*, u.name AS student_name, u.email AS student_email
       FROM overtime_requests otr
       JOIN students s ON s.student_id = otr.student_id
       JOIN users    u ON u.user_id     = s.user_id
       WHERE otr.supervisor_id = ?
       ORDER BY otr.created_at DESC`,
      [supervisorId]
    );
    return res.json({ overtime_requests: rows });
  } catch (err) { return handleErr(err, res); }
};

// PUT /api/supervisor/overtime-requests/:id
exports.processOvertime = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    const { id }       = req.params;
    const { status, supervisor_remarks } = req.body;

    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be approved or rejected.' });

    const [rows] = await db.query(
      'SELECT status FROM overtime_requests WHERE overtime_id = ? AND supervisor_id = ?',
      [id, supervisorId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Overtime request not found.' });
    if (rows[0].status !== 'pending')
      return res.status(400).json({ message: 'Only pending requests can be processed.' });

    await db.query(
      'UPDATE overtime_requests SET status = ?, supervisor_remarks = ?, updated_at = NOW() WHERE overtime_id = ?',
      [status, supervisor_remarks?.trim() || null, id]
    );
    return res.json({ message: `Overtime request ${status}.` });
  } catch (err) { return handleErr(err, res); }
};


// ══════════════════════════════════════════════════════════
// ATTENDANCE RECORDS
// ══════════════════════════════════════════════════════════

exports.recordAttendance = async (req, res) => {
  try {
    const studentId    = await getStudentId(req.user.id);
    const supervisorId = await getStudentSupervisor(studentId);
    const { attendance_date, clock_in, clock_out, remarks } = req.body;

    if (!attendance_date || !clock_in)
      return res.status(400).json({ message: 'Date and clock-in time are required.' });
    if (clock_out && clock_out <= clock_in)
      return res.status(400).json({ message: 'Clock-out must be after clock-in.' });

    const [dup] = await db.query(
      'SELECT attendance_id FROM attendance_records WHERE student_id = ? AND attendance_date = ?',
      [studentId, attendance_date]
    );
    if (dup.length)
      return res.status(409).json({ message: 'Attendance already recorded for this date.' });

    await db.query(
      `INSERT INTO attendance_records
         (student_id, supervisor_id, attendance_date, clock_in, clock_out, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, supervisorId, attendance_date, clock_in, clock_out || null, remarks?.trim() || null]
    );
    return res.status(201).json({ message: 'Attendance recorded successfully.' });
  } catch (err) { return handleErr(err, res); }
};

exports.clockOut = async (req, res) => {
  try {
    const studentId  = await getStudentId(req.user.id);
    const { id }     = req.params;
    const { clock_out, remarks } = req.body;

    if (!clock_out)
      return res.status(400).json({ message: 'Clock-out time is required.' });

    const [rows] = await db.query(
      'SELECT clock_in, clock_out, status FROM attendance_records WHERE attendance_id = ? AND student_id = ?',
      [id, studentId]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Attendance record not found.' });
    if (rows[0].clock_out)
      return res.status(400).json({ message: 'You have already clocked out for this record.' });
    if (clock_out <= rows[0].clock_in)
      return res.status(400).json({ message: 'Clock-out time must be after clock-in time.' });

    // If the record was already verified, reset to pending so the supervisor
    // can re-verify with the updated clock-out time.
    const wasVerified = rows[0].status !== 'pending';

    await db.query(
      `UPDATE attendance_records
       SET clock_out = ?,
           remarks   = COALESCE(NULLIF(?, ''), remarks),
           status    = IF(status != 'pending', 'pending', status),
           updated_at = NOW()
       WHERE attendance_id = ?`,
      [clock_out, remarks?.trim() || '', id]
    );
    return res.json({
      message: wasVerified
        ? 'Clocked out successfully. Your attendance has been reset to pending for re-verification.'
        : 'Clocked out successfully.',
    });
  } catch (err) { return handleErr(err, res); }
};

exports.myAttendance = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    const [rows] = await db.query(
      `SELECT ar.*, su.name AS supervisor_name
       FROM attendance_records ar
       JOIN industry_supervisors isup ON isup.supervisor_id = ar.supervisor_id
       JOIN users su ON su.user_id = isup.user_id
       WHERE ar.student_id = ?
       ORDER BY ar.attendance_date DESC`,
      [studentId]
    );
    return res.json({ attendance: rows });
  } catch (err) { return handleErr(err, res); }
};

exports.supervisorAttendance = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    const [rows] = await db.query(
      `SELECT ar.*, u.name AS student_name, u.email AS student_email
       FROM attendance_records ar
       JOIN students s ON s.student_id = ar.student_id
       JOIN users    u ON u.user_id     = s.user_id
       WHERE ar.supervisor_id = ?
       ORDER BY ar.attendance_date DESC, ar.created_at DESC`,
      [supervisorId]
    );
    return res.json({ attendance: rows });
  } catch (err) { return handleErr(err, res); }
};

exports.verifyAttendance = async (req, res) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    const { id }       = req.params;
    const { status }   = req.body;

    if (!['present', 'absent'].includes(status))
      return res.status(400).json({ message: 'Status must be present or absent.' });

    const [rows] = await db.query(
      'SELECT status FROM attendance_records WHERE attendance_id = ? AND supervisor_id = ?',
      [id, supervisorId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Attendance record not found.' });
    if (rows[0].status !== 'pending')
      return res.status(400).json({ message: 'Only pending records can be verified.' });

    await db.query(
      'UPDATE attendance_records SET status = ?, updated_at = NOW() WHERE attendance_id = ?',
      [status, id]
    );
    return res.json({ message: `Attendance marked as ${status}.` });
  } catch (err) { return handleErr(err, res); }
};


// ══════════════════════════════════════════════════════════
// ADMIN — READ-ONLY MONITORING ENDPOINTS
// ══════════════════════════════════════════════════════════

exports.adminAllAttendance = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ar.*,
              u_student.name  AS student_name,
              u_student.email AS student_email,
              u_sup.name      AS supervisor_name
       FROM attendance_records ar
       JOIN students              s         ON s.student_id       = ar.student_id
       JOIN users                 u_student ON u_student.user_id  = s.user_id
       JOIN industry_supervisors  isup      ON isup.supervisor_id = ar.supervisor_id
       JOIN users                 u_sup     ON u_sup.user_id      = isup.user_id
       ORDER BY ar.attendance_date DESC, ar.created_at DESC`
    );
    return res.json({ attendance: rows });
  } catch (err) { return handleErr(err, res); }
};

exports.adminAllLeaveRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT lr.*,
              u_student.name  AS student_name,
              u_student.email AS student_email,
              s.matric_number,
              u_sup.name      AS supervisor_name
       FROM leave_requests        lr
       JOIN students              s         ON s.student_id       = lr.student_id
       JOIN users                 u_student ON u_student.user_id  = s.user_id
       JOIN industry_supervisors  isup      ON isup.supervisor_id = lr.supervisor_id
       JOIN users                 u_sup     ON u_sup.user_id      = isup.user_id
       ORDER BY lr.created_at DESC`
    );
    return res.json({ leave_requests: rows });
  } catch (err) { return handleErr(err, res); }
};

exports.adminAllOvertimeRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT otr.*,
              u_student.name  AS student_name,
              u_student.email AS student_email,
              u_sup.name      AS supervisor_name
       FROM overtime_requests     otr
       JOIN students              s         ON s.student_id       = otr.student_id
       JOIN users                 u_student ON u_student.user_id  = s.user_id
       JOIN industry_supervisors  isup      ON isup.supervisor_id = otr.supervisor_id
       JOIN users                 u_sup     ON u_sup.user_id      = isup.user_id
       ORDER BY otr.created_at DESC`
    );
    return res.json({ overtime_requests: rows });
  } catch (err) { return handleErr(err, res); }
};