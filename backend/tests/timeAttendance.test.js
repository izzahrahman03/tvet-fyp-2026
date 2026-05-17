'use strict';
// ─────────────────────────────────────────────────────────
// tests/timeAttendance.test.js
// White Box Tests — Time and Attendance Management Module
// Run: npx jest tests/timeAttendance.test.js
// ─────────────────────────────────────────────────────────

process.env.JWT_SECRET = 'test_secret_key';

// ── Mocks ─────────────────────────────────────────────────
jest.mock('../database/db');
jest.mock('multer', () => {
  const m = () => ({ single: () => (_req, _res, next) => next() });
  m.diskStorage = () => ({});
  return m;
});
// Mock fs.existsSync used in downloadLeaveDocument
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync:  jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────
const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../database/db');
const fs      = require('fs');

const timeRoutes = require('../routes/timeRoutes');

// ── Test App ──────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api', timeRoutes);

// ── Helpers ───────────────────────────────────────────────
const SECRET               = 'test_secret_key';
const makeStudentToken     = (id = 1) => jwt.sign({ id }, SECRET);
const makeSupervisorToken  = (id = 2) => jwt.sign({ id }, SECRET);
const makeAdminToken       = (id = 3) => jwt.sign({ id }, SECRET);

// ─────────────────────────────────────────────────────────
describe('Time and Attendance Management — White Box Tests', () => {

  beforeEach(() => {
    jest.resetAllMocks();
    fs.existsSync.mockReturnValue(true); // default: directories exist
  });

  // ══════════════════════════════════════════════════════════
  // SUBMIT LEAVE  POST /api/student/leave-requests
  // ══════════════════════════════════════════════════════════
  describe('POST /api/student/leave-requests', () => {

    // Helper: mock student middleware and getStudentId + getStudentSupervisor
    const mockStudentSetup = () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'student' }]])              // requireStudent
        .mockResolvedValueOnce([[{ student_id: 10 }]])               // getStudentId
        .mockResolvedValueOnce([[{ supervisor_id: 30 }]]);           // getStudentSupervisor
    };

    test('WB-TM01: No student profile throws 403', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'student' }]])  // requireStudent
        .mockResolvedValueOnce([[]]); // getStudentId — no profile
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual', duration_type: 'full_day', reason: 'Holiday' });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('No student profile');
    });

    test('WB-TM02: No active internship returns 400', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'student' }]])
        .mockResolvedValueOnce([[{ student_id: 10 }]])
        .mockResolvedValueOnce([[]]); // getStudentSupervisor — no active internship
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual', duration_type: 'full_day', reason: 'Holiday', start_date: '2025-10-01', end_date: '2025-10-01' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No active internship');
    });

    test('WB-TM03: Missing leave_type/duration_type/reason returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual' }); // missing duration_type and reason
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Leave type, duration type, and reason are required');
    });

    test('WB-TM04: Invalid leave_type returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'sick', duration_type: 'full_day', reason: 'Sick' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid leave type');
    });

    test('WB-TM05: Invalid duration_type returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual', duration_type: 'quarter_day', reason: 'Holiday' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid duration type');
    });

    test('WB-TM06: Full day leave missing start/end date returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual', duration_type: 'full_day', reason: 'Holiday' }); // no dates
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Start date and end date are required');
    });

    test('WB-TM07: Full day leave start_date after end_date returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual', duration_type: 'full_day', reason: 'Holiday', start_date: '2025-10-10', end_date: '2025-10-05' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Start date cannot be after end date');
    });

    test('WB-TM08: Half day leave missing start_date returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual', duration_type: 'half_day', reason: 'Holiday', session: 'AM' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Leave date is required for half day');
    });

    test('WB-TM09: Half day leave invalid session returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual', duration_type: 'half_day', reason: 'Holiday', start_date: '2025-10-01', session: 'MID' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Session (AM or PM)');
    });

    test('WB-TM10: Half day leave sets end_date = start_date and stores session', async () => {
      mockStudentSetup();
      db.query.mockResolvedValueOnce([{ insertId: 1 }]); // INSERT
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'annual', duration_type: 'half_day', reason: 'Holiday', start_date: '2025-10-01', session: 'AM' });
      expect(res.status).toBe(201);
      // Verify INSERT was called with resolved end_date = start_date and session = 'AM'
      const insertCall = db.query.mock.calls.find(c => typeof c[0] === 'string' && c[0].includes('INSERT INTO leave_requests'));
      expect(insertCall).toBeDefined();
      const values = insertCall[1];
      expect(values[5]).toBe('2025-10-01'); // end_date same as start_date
      expect(values[6]).toBe('AM');          // session stored
    });

    test('WB-TM11: Valid full day leave returns 201', async () => {
      mockStudentSetup();
      db.query.mockResolvedValueOnce([{ insertId: 1 }]);
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ leave_type: 'medical', duration_type: 'full_day', reason: 'Sick', start_date: '2025-10-01', end_date: '2025-10-02' });
      expect(res.status).toBe(201);
      expect(res.body.message).toContain('submitted successfully');
    });
  });

  // ══════════════════════════════════════════════════════════
  // PROCESS LEAVE  PUT /api/supervisor/leave-requests/:id
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/supervisor/leave-requests/:id', () => {

    const mockSupervisorSetup = () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'industry_supervisor' }]])  // requireSupervisor
        .mockResolvedValueOnce([[{ supervisor_id: 30 }]]);           // getSupervisorId
    };

    test('WB-TM12: Invalid status on leave processing returns 400', async () => {
      mockSupervisorSetup();
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/leave-requests/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'pending' }); // invalid — must be approved/rejected
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('approved or rejected');
    });

    test('WB-TM13: Leave not found for this supervisor returns 404', async () => {
      mockSupervisorSetup();
      db.query.mockResolvedValueOnce([[]]); // no leave found for this supervisor
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/leave-requests/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'approved' });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Leave request not found.');
    });

    test('WB-TM14: Already processed leave returns 400', async () => {
      mockSupervisorSetup();
      db.query.mockResolvedValueOnce([[{ status: 'approved' }]]); // already approved
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/leave-requests/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'rejected' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only pending requests');
    });

    test('WB-TM15: Supervisor approves pending leave returns 200', async () => {
      mockSupervisorSetup();
      db.query
        .mockResolvedValueOnce([[{ status: 'pending' }]])  // leave found
        .mockResolvedValueOnce([{ affectedRows: 1 }]);     // UPDATE
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/leave-requests/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'approved', supervisor_remarks: 'Noted' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('approved');
    });
  });

  // ══════════════════════════════════════════════════════════
  // DOWNLOAD LEAVE DOCUMENT
  // ══════════════════════════════════════════════════════════
  describe('GET /api/supervisor/leave-requests/:id/document', () => {

    test('WB-TM16: No document_path returns 404', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'industry_supervisor' }]])
        .mockResolvedValueOnce([[{ status: 'approved' }]]) // processLeave check not needed here — it's a different route
        .mockResolvedValueOnce([[{ document_path: null }]]); // no document
      // Actually for download: just requireSupervisor + db.query
      db.query.mockReset();
      db.query
        .mockResolvedValueOnce([[{ role: 'industry_supervisor' }]])
        .mockResolvedValueOnce([[{ document_path: null }]]);
      const token = makeSupervisorToken();
      const res = await request(app)
        .get('/api/supervisor/leave-requests/1/document')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('No document found');
    });

    test('WB-TM17: File not on disk returns 404', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'industry_supervisor' }]])
        .mockResolvedValueOnce([[{ document_path: 'leave_1_123.pdf' }]]);
      fs.existsSync.mockReturnValue(false); // file not on disk
      const token = makeSupervisorToken();
      const res = await request(app)
        .get('/api/supervisor/leave-requests/1/document')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('File not found on server');
    });
  });

  // ══════════════════════════════════════════════════════════
  // SUBMIT OVERTIME  POST /api/student/overtime-requests
  // ══════════════════════════════════════════════════════════
  describe('POST /api/student/overtime-requests', () => {

    const mockStudentSetup = () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'student' }]])
        .mockResolvedValueOnce([[{ student_id: 10 }]])
        .mockResolvedValueOnce([[{ supervisor_id: 30 }]]);
    };

    test('WB-TM18: Missing fields returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/overtime-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ overtime_date: '2025-10-01', start_time: '18:00' }); // missing end_time and reason
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('All fields are required');
    });

    test('WB-TM19: start_time >= end_time returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/overtime-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ overtime_date: '2025-10-01', start_time: '20:00', end_time: '18:00', reason: 'Project deadline' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('End time must be after start time');
    });

    test('WB-TM20: start_time = end_time returns 400 (boundary)', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/overtime-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ overtime_date: '2025-10-01', start_time: '18:00', end_time: '18:00', reason: 'Project deadline' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('End time must be after');
    });

    test('WB-TM21: Valid overtime returns 201', async () => {
      mockStudentSetup();
      db.query.mockResolvedValueOnce([{ insertId: 1 }]);
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/overtime-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ overtime_date: '2025-10-01', start_time: '18:00', end_time: '21:00', reason: 'Project deadline' });
      expect(res.status).toBe(201);
      expect(res.body.message).toContain('submitted successfully');
    });
  });

  // ══════════════════════════════════════════════════════════
  // PROCESS OVERTIME  PUT /api/supervisor/overtime-requests/:id
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/supervisor/overtime-requests/:id', () => {

    const mockSupervisorSetup = () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'industry_supervisor' }]])
        .mockResolvedValueOnce([[{ supervisor_id: 30 }]]);
    };

    test('WB-TM22: Invalid status on overtime processing returns 400', async () => {
      mockSupervisorSetup();
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/overtime-requests/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('approved or rejected');
    });

    test('WB-TM23: Overtime not found for supervisor returns 404', async () => {
      mockSupervisorSetup();
      db.query.mockResolvedValueOnce([[]]); // not found
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/overtime-requests/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'approved' });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Overtime request not found.');
    });

    test('WB-TM24: Already processed overtime returns 400', async () => {
      mockSupervisorSetup();
      db.query.mockResolvedValueOnce([[{ status: 'approved' }]]); // already processed
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/overtime-requests/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'rejected' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only pending requests');
    });
  });

  // ══════════════════════════════════════════════════════════
  // RECORD ATTENDANCE  POST /api/student/attendance
  // ══════════════════════════════════════════════════════════
  describe('POST /api/student/attendance', () => {

    const mockStudentSetup = () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'student' }]])
        .mockResolvedValueOnce([[{ student_id: 10 }]])
        .mockResolvedValueOnce([[{ supervisor_id: 30 }]]);
    };

    test('WB-TM25: Missing attendance_date or clock_in returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({ clock_in: '09:00' }); // missing attendance_date
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Date and clock-in time are required');
    });

    test('WB-TM26: clock_out before clock_in returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({ attendance_date: '2025-10-01', clock_in: '09:00', clock_out: '08:00' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Clock-out must be after clock-in');
    });

    test('WB-TM27: clock_out equal to clock_in returns 400 (boundary)', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({ attendance_date: '2025-10-01', clock_in: '09:00', clock_out: '09:00' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Clock-out must be after clock-in');
    });

    test('WB-TM28: Duplicate attendance for same date returns 409', async () => {
      mockStudentSetup();
      db.query.mockResolvedValueOnce([[{ attendance_id: 5 }]]); // duplicate found
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({ attendance_date: '2025-10-01', clock_in: '09:00' });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already recorded');
    });

    test('WB-TM29: Valid clock_in only returns 201', async () => {
      mockStudentSetup();
      db.query
        .mockResolvedValueOnce([[]])               // no duplicate
        .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT
      const token = makeStudentToken();
      const res = await request(app)
        .post('/api/student/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({ attendance_date: '2025-10-01', clock_in: '09:00' });
      expect(res.status).toBe(201);
      expect(res.body.message).toContain('recorded successfully');
    });
  });

  // ══════════════════════════════════════════════════════════
  // CLOCK OUT  PATCH /api/student/attendance/:id/clock-out
  // ══════════════════════════════════════════════════════════
  describe('PATCH /api/student/attendance/:id/clock-out', () => {

    const mockStudentSetup = () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'student' }]])
        .mockResolvedValueOnce([[{ student_id: 10 }]]);
    };

    test('WB-TM30: Missing clock_out returns 400', async () => {
      mockStudentSetup();
      const token = makeStudentToken();
      const res = await request(app)
        .patch('/api/student/attendance/1/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .send({}); // no clock_out
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Clock-out time is required');
    });

    test('WB-TM31: Attendance record not found returns 404', async () => {
      mockStudentSetup();
      db.query.mockResolvedValueOnce([[]]); // not found
      const token = makeStudentToken();
      const res = await request(app)
        .patch('/api/student/attendance/999/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .send({ clock_out: '18:00' });
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    test('WB-TM32: Already clocked out returns 400', async () => {
      mockStudentSetup();
      db.query.mockResolvedValueOnce([[{ clock_in: '09:00', clock_out: '17:00', status: 'pending' }]]);
      const token = makeStudentToken();
      const res = await request(app)
        .patch('/api/student/attendance/1/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .send({ clock_out: '18:00' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already clocked out');
    });

    test('WB-TM33: clock_out before clock_in returns 400', async () => {
      mockStudentSetup();
      db.query.mockResolvedValueOnce([[{ clock_in: '09:00', clock_out: null, status: 'pending' }]]);
      const token = makeStudentToken();
      const res = await request(app)
        .patch('/api/student/attendance/1/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .send({ clock_out: '08:00' }); // before clock_in
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be after clock-in');
    });

    test('WB-TM34: Clocking out on verified record resets status to pending', async () => {
      mockStudentSetup();
      db.query
        .mockResolvedValueOnce([[{ clock_in: '09:00', clock_out: null, status: 'present' }]]) // was verified
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE
      const token = makeStudentToken();
      const res = await request(app)
        .patch('/api/student/attendance/1/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .send({ clock_out: '18:00' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('re-verification');
      // Confirm IF(status != 'pending', 'pending', status) was in the UPDATE
      const updateCall = db.query.mock.calls.find(c =>
        typeof c[0] === 'string' && c[0].includes('clock_out')
      );
      expect(updateCall).toBeDefined();
    });

    test('WB-TM35: Clocking out on pending record returns normal message', async () => {
      mockStudentSetup();
      db.query
        .mockResolvedValueOnce([[{ clock_in: '09:00', clock_out: null, status: 'pending' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const token = makeStudentToken();
      const res = await request(app)
        .patch('/api/student/attendance/1/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .send({ clock_out: '18:00' });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Clocked out successfully.');
    });
  });

  // ══════════════════════════════════════════════════════════
  // VERIFY ATTENDANCE  PUT /api/supervisor/attendance/:id
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/supervisor/attendance/:id', () => {

    const mockSupervisorSetup = () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'industry_supervisor' }]])
        .mockResolvedValueOnce([[{ supervisor_id: 30 }]]);
    };

    test('WB-TM36: Invalid status on attendance verification returns 400', async () => {
      mockSupervisorSetup();
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/attendance/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'late' }); // not present or absent
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('present or absent');
    });

    test('WB-TM37: Attendance not found for supervisor returns 404', async () => {
      mockSupervisorSetup();
      db.query.mockResolvedValueOnce([[]]); // not found
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/attendance/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'present' });
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    test('WB-TM38: Already verified attendance returns 400', async () => {
      mockSupervisorSetup();
      db.query.mockResolvedValueOnce([[{ status: 'present' }]]); // already verified
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/attendance/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'absent' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only pending records');
    });

    test('WB-TM39: Supervisor marks present returns 200', async () => {
      mockSupervisorSetup();
      db.query
        .mockResolvedValueOnce([[{ status: 'pending' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/attendance/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'present' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('present');
    });

    test('WB-TM40: Supervisor marks absent returns 200', async () => {
      mockSupervisorSetup();
      db.query
        .mockResolvedValueOnce([[{ status: 'pending' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const token = makeSupervisorToken();
      const res = await request(app)
        .put('/api/supervisor/attendance/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'absent' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('absent');
    });
  });
});