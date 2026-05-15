const express               = require('express');
const router                = express.Router();
const timeControllers       = require('../controllers/timeControllers');
const { verifyToken, requireStudent, requireSupervisor, requireAdmin }       = require('../middleware/authMiddleware');

// ── Student: Leave Requests ───────────────────────────────
router.post('/student/leave-requests',    verifyToken, requireStudent, timeControllers.uploadLeaveDoc, timeControllers.submitLeave);
router.get ('/student/leave-requests',    verifyToken, requireStudent, timeControllers.myLeaveRequests);

// ── Student: Overtime Requests ────────────────────────────
router.post('/student/overtime-requests', verifyToken, requireStudent, timeControllers.submitOvertime);
router.get ('/student/overtime-requests', verifyToken, requireStudent, timeControllers.myOvertimeRequests);
 
// ── Student: Attendance ───────────────────────────────────
router.post('/student/attendance',        verifyToken, requireStudent, timeControllers.recordAttendance);
router.get ('/student/attendance',        verifyToken, requireStudent, timeControllers.myAttendance);
router.patch('/student/attendance/:id/clock-out', verifyToken, requireStudent, timeControllers.clockOut);
router.get('/profile', verifyToken, timeControllers.getStudentProfileInfo);
 
// ── Supervisor: Leave Requests ────────────────────────────
router.get ('/supervisor/leave-requests',       verifyToken, requireSupervisor, timeControllers.supervisorLeaveRequests);
router.put ('/supervisor/leave-requests/:id',   verifyToken, requireSupervisor, timeControllers.processLeave);
router.get ('/supervisor/leave-requests/:id/document', verifyToken, requireSupervisor, timeControllers.downloadLeaveDocument);
 
// ── Supervisor: Overtime Requests ─────────────────────────
router.get ('/supervisor/overtime-requests',     verifyToken, requireSupervisor, timeControllers.supervisorOvertimeRequests);
router.put ('/supervisor/overtime-requests/:id', verifyToken, requireSupervisor, timeControllers.processOvertime);
 
// ── Supervisor: Attendance ────────────────────────────────
router.get ('/supervisor/attendance',            verifyToken, requireSupervisor, timeControllers.supervisorAttendance);
router.put ('/supervisor/attendance/:id',        verifyToken, requireSupervisor, timeControllers.verifyAttendance);

router.get ('/admin/attendance',                 verifyToken, timeControllers.adminAllAttendance);
router.get ('/admin/leave-requests',              verifyToken, timeControllers.adminAllLeaveRequests);
router.get ('/admin/overtime-requests',           verifyToken, timeControllers.adminAllOvertimeRequests);
router.get ('/admin/leave-requests/:id/document', verifyToken, requireAdmin, timeControllers.downloadLeaveDocument);

module.exports = router;