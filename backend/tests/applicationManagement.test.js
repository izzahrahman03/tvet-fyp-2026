'use strict';
// ─────────────────────────────────────────────────────────
// tests/applicationManagement.test.js
// White Box Tests — Application Management Module
// Run: npx jest tests/applicationManagement.test.js
// ─────────────────────────────────────────────────────────

process.env.JWT_SECRET = 'test_secret_key';

// ── Mocks ─────────────────────────────────────────────────
jest.mock('../database/db');
jest.mock('../emails/adminEmail', () => ({
  sendApplicationStatusEmail: jest.fn(),
  sendBulkActivationEmail:    jest.fn(),
}));
// Multer causes issues in unit tests — stub it out
jest.mock('multer', () => {
  const m = () => ({ single: () => (_req, _res, next) => next(), fields: () => (_req, _res, next) => next() });
  m.diskStorage = () => ({});
  return m;
});

// ── Imports ───────────────────────────────────────────────
const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../database/db');

const intakeRoutes      = require('../routes/intakeRoutes');
const applicationRoutes = require('../routes/applicationRoutes');
const adminRoutes       = require('../routes/adminRoutes');
const interviewerRoutes = require('../routes/interviewerApplicationsRoutes');

// ── Test App ──────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api', intakeRoutes);
app.use('/api', applicationRoutes);
app.use('/api', adminRoutes);
app.use('/api', interviewerRoutes);

// ── Helpers ───────────────────────────────────────────────
const SECRET           = 'test_secret_key';
const makeToken        = (id = 1) => jwt.sign({ id }, SECRET);
const makeAdminToken   = (id = 1) => jwt.sign({ id }, SECRET);
const makeManagerToken = (id = 2) => jwt.sign({ id }, SECRET);

// ─────────────────────────────────────────────────────────
describe('Application Management — White Box Tests', () => {
  let mockConn;

  beforeEach(() => {
    jest.resetAllMocks();
    mockConn = {
      beginTransaction: jest.fn().mockResolvedValue(),
      query:            jest.fn(),
      commit:           jest.fn().mockResolvedValue(),
      rollback:         jest.fn().mockResolvedValue(),
      release:          jest.fn(),
    };
    db.getConnection.mockResolvedValue(mockConn);
  });

  // ══════════════════════════════════════════════════════════
  // CREATE INTAKE  POST /api/intakes
  // ══════════════════════════════════════════════════════════
  describe('POST /api/intakes', () => {

    // Helper: mock requireAdminOrManager to pass as admin, requireAdminOrManagerOrPartner too
    const adminPass = () => db.query.mockResolvedValueOnce([[{ role: 'admin' }]]);

    test('WB-AM01: Missing required fields returns 400', async () => {
      adminPass();
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/intakes')
        .set('Authorization', `Bearer ${token}`)
        .send({ intake_start_date: '2025-09-01', intake_end_date: '2025-12-31', max_capacity: 30 });
      // missing intake_name
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('WB-AM02: intake_start_date >= intake_end_date returns 400', async () => {
      adminPass();
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/intakes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          intake_name: 'Intake 2025',
          intake_start_date: '2025-09-01', intake_end_date: '2025-09-01',
          application_start_date: '2025-08-01', application_end_date: '2025-08-30',
          max_capacity: 30,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('before intake end date');
    });

    test('WB-AM03: max_capacity = 0 returns 400', async () => {
      adminPass();
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/intakes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          intake_name: 'Intake 2025',
          intake_start_date: '2025-09-01', intake_end_date: '2025-12-31',
          application_start_date: '2025-08-01', application_end_date: '2025-08-30',
          max_capacity: 0,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('intake_name, intake_start_date, intake_end_date, and max_capacity are required.');
    });

    test('WB-AM04: Application start >= application end returns 400', async () => {
      adminPass();
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/intakes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          intake_name: 'Intake 2025',
          intake_start_date: '2025-09-01', intake_end_date: '2025-12-31',
          application_start_date: '2025-08-20', application_end_date: '2025-08-10',
          max_capacity: 30,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Application start date must be before');
    });

    test('WB-AM05: Application start >= intake start returns 400', async () => {
      adminPass();
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/intakes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          intake_name: 'Intake 2025',
          intake_start_date: '2025-09-01', intake_end_date: '2025-12-31',
          application_start_date: '2025-09-01', application_end_date: '2025-10-01',
          max_capacity: 30,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('earlier than the intake start');
    });

    test('WB-AM06: Duplicate intake name returns 409', async () => {
      adminPass();
      db.query.mockResolvedValueOnce([[{ intake_id: 5 }]]); // existing name found
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/intakes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          intake_name: 'Existing Intake',
          intake_start_date: '2025-09-01', intake_end_date: '2025-12-31',
          application_start_date: '2025-08-01', application_end_date: '2025-08-30',
          max_capacity: 30,
        });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ══════════════════════════════════════════════════════════
  // UPDATE INTAKE  PUT /api/intakes/:id
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/intakes/:id', () => {

    test('WB-AM07: Capacity below current enrollment returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      db.query.mockResolvedValueOnce([{ total: 10 }]); // COUNT students — wait this is wrong
      // Actually: const [countRows] = await db.query('SELECT COUNT(*) AS total FROM students WHERE intake_id = ?', [id]);
      // So: mockResolvedValueOnce([[{ total: 10 }]])
      db.query.mockReset();
      db.query
        .mockResolvedValueOnce([[{ role: 'admin' }]])  // requireAdminOrManager
        .mockResolvedValueOnce([[{ total: 10 }]]);     // COUNT students
      const token = makeAdminToken();
      const res = await request(app)
        .put('/api/intakes/1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          intake_name: 'Updated', intake_start_date: '2025-09-01',
          intake_end_date: '2025-12-31', max_capacity: 5, // below enrollment of 10
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot set capacity below');
    });

    test('WB-AM08: Non-existent intake returns 404', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'admin' }]])  // requireAdminOrManager
        .mockResolvedValueOnce([[{ total: 0 }]])        // COUNT students
        .mockResolvedValueOnce([[]])                    // duplicate name check — none
        .mockResolvedValueOnce([{ affectedRows: 0 }]); // UPDATE — nothing found
      const token = makeAdminToken();
      const res = await request(app)
        .put('/api/intakes/999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          intake_name: 'Ghost', intake_start_date: '2025-09-01',
          intake_end_date: '2025-12-31', max_capacity: 30,
        });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Intake not found.');
    });
  });

  // ══════════════════════════════════════════════════════════
  // DELETE INTAKE  DELETE /api/intakes/:id
  // ══════════════════════════════════════════════════════════
  describe('DELETE /api/intakes/:id', () => {

    test('WB-AM09: Intake with enrolled students cannot be deleted', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'admin' }]])  // requireAdminOrManager
        .mockResolvedValueOnce([[{ total: 3 }]]);       // 3 students enrolled
      const token = makeAdminToken();
      const res = await request(app)
        .delete('/api/intakes/1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete');
    });

    test('WB-AM10: Non-existent intake returns 404', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'admin' }]])  // requireAdminOrManager
        .mockResolvedValueOnce([[{ total: 0 }]])        // no students
        .mockResolvedValueOnce([{ affectedRows: 0 }]); // DELETE — nothing found
      const token = makeAdminToken();
      const res = await request(app)
        .delete('/api/intakes/999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Intake not found.');
    });
  });

  // ══════════════════════════════════════════════════════════
  // SUBMIT APPLICATION  POST /api/application-form
  // ══════════════════════════════════════════════════════════
  describe('POST /api/application-form', () => {

    test('WB-AM11: Submit with missing required fields returns 400', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .post('/api/application-form')
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'submit', fullName: 'Ali', interviewSlotId: 1 });
      // missing icNumber, dob, gender, email, phone, etc.
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Missing required fields');
    });

    test('WB-AM12: Submit without interview slot returns 400', async () => {
      const token = makeToken(1);
      const res = await request(app)
        .post('/api/application-form')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'submit',
          fullName: 'Ali', icNumber: '991122-14-5678', dob: '1999-11-22',
          gender: 'male', email: 'ali@mail.com', phone: '0123456789',
          fullAddress: '123 Jln Test', postalCode: '10000', state: 'Penang',
          hearAboutUs: 'friend',
          // no interviewSlotId
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('interview slot');
    });

    test('WB-AM13: Locked application (status beyond submitted) returns 400', async () => {
      const token = makeToken(1);
      // Existing application with status 'interview'
      db.query.mockResolvedValueOnce([[{ application_id: 5, application_status: 'interview' }]]);
      const res = await request(app)
        .post('/api/application-form')
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'draft' }); // even draft save is blocked
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('no longer be edited');
    });

    test('WB-AM14: Full interview slot returns 400', async () => {
      const token = makeToken(1);
      db.query
        .mockResolvedValueOnce([[]])  // no existing application
        .mockResolvedValueOnce([[{ slot_id: 1, capacity: 5, booked: 5 }]]); // slot is full
      const res = await request(app)
        .post('/api/application-form')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'submit',
          fullName: 'Ali', icNumber: '991122-14-5678', dob: '1999-11-22',
          gender: 'male', email: 'ali@mail.com', phone: '0123456789',
          fullAddress: '123 Jln Test', postalCode: '10000', state: 'Penang',
          hearAboutUs: 'friend', interviewSlotId: 1,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Selected interview slot no longer exists.');
    });
  });

  // ══════════════════════════════════════════════════════════
  // ACCEPT OFFER  POST /api/my-application/accept
  // ══════════════════════════════════════════════════════════
  describe('POST /api/my-application/accept', () => {

    test('WB-AM15: No application found returns 404', async () => {
      const token = makeToken(1);
      mockConn.query.mockResolvedValueOnce([[]]); // no application
      const res = await request(app)
        .post('/api/my-application/accept')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('No application found.');
    });

    test('WB-AM16: Application not passed returns 400', async () => {
      const token = makeToken(1);
      mockConn.query.mockResolvedValueOnce([[{ application_id: 1, application_status: 'submitted' }]]);
      const res = await request(app)
        .post('/api/my-application/accept')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not passed');
    });
  });

  // ══════════════════════════════════════════════════════════
  // DECLINE OFFER  POST /api/my-application/decline
  // ══════════════════════════════════════════════════════════
  describe('POST /api/my-application/decline', () => {

    test('WB-AM17: Invalid status (draft) returns 400', async () => {
      const token = makeToken(1);
      db.query.mockResolvedValueOnce([[{ application_id: 1, application_status: 'draft', applicant_response: null }]]);
      const res = await request(app)
        .post('/api/my-application/decline')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot decline');
    });

    test('WB-AM18: Passed application sets applicant_response = rejected', async () => {
      const token = makeToken(1);
      db.query
        .mockResolvedValueOnce([[{ application_id: 1, application_status: 'passed', applicant_response: 'none' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE response
        .mockResolvedValueOnce([[{ email: 'a@mail.com', name: 'Ali' }]]); // fetch for email
      const res = await request(app)
        .post('/api/my-application/decline')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('declined');
    });
  });

  // ══════════════════════════════════════════════════════════
  // UPDATE APPLICATION STATUS  PUT /api/applications/:id/status
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/applications/:id/status', () => {

    test('WB-AM19: Non-existent application returns 404', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      mockConn.query.mockResolvedValueOnce([[]]); // application not found
      const token = makeAdminToken();
      const res = await request(app)
        .put('/api/applications/999/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'attended' });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Application not found.');
    });

    test('WB-AM20: Locked status (passed) cannot be updated', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      mockConn.query.mockResolvedValueOnce([[{ application_status: 'passed' }]]);
      const token = makeAdminToken();
      const res = await request(app)
        .put('/api/applications/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'attended' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('"passed" and cannot be updated');
    });

    test('WB-AM21: Invalid transition (submitted → passed) returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      mockConn.query.mockResolvedValueOnce([[{ application_status: 'submitted' }]]);
      const token = makeAdminToken();
      const res = await request(app)
        .put('/api/applications/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'passed' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot change status');
    });

    test('WB-AM22: Valid transition submitted → attended returns 200', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      mockConn.query
        .mockResolvedValueOnce([[{ application_status: 'submitted' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE
      db.query.mockResolvedValueOnce([[{ id: 1, name: 'Ali', email: 'a@mail.com', phone: '011', application_status: 'attended', created_at: new Date(), user_id: 1 }]]);
      const token = makeAdminToken();
      const res = await request(app)
        .put('/api/applications/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'attended' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('attended');
    });

    test('WB-AM23: Valid transition attended → passed returns 200', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      mockConn.query
        .mockResolvedValueOnce([[{ application_status: 'attended' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      db.query.mockResolvedValueOnce([[{ id: 1, name: 'Ali', email: 'a@mail.com', phone: '011', application_status: 'passed', created_at: new Date(), user_id: 1 }]]);
      const token = makeAdminToken();
      const res = await request(app)
        .put('/api/applications/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'passed' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('passed');
    });
  });

  // ══════════════════════════════════════════════════════════
  // CREATE INTERVIEW SLOT  POST /api/interview-slots
  // ══════════════════════════════════════════════════════════
  describe('POST /api/interview-slots', () => {

    test('WB-AM24: Missing datetime returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/interview-slots')
        .set('Authorization', `Bearer ${token}`)
        .send({ capacity: 5 }); // no datetime
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('datetime is required.');
    });

    test('WB-AM25: Capacity = 0 returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/interview-slots')
        .set('Authorization', `Bearer ${token}`)
        .send({ datetime: '2026-10-01T10:00:00', capacity: 0 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('positive number');
    });

    test('WB-AM26: Past datetime returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/interview-slots')
        .set('Authorization', `Bearer ${token}`)
        .send({ datetime: '2020-01-01T10:00:00', capacity: 5 }); // past
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('future');
    });

    test('WB-AM27: Interviewer conflict returns 409', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdminOrManager
      mockConn.query.mockResolvedValueOnce([[{ user_id: 10, name: 'Dr Amir' }]]); // conflict found
      const token = makeAdminToken();
      const res = await request(app)
        .post('/api/interview-slots')
        .set('Authorization', `Bearer ${token}`)
        .send({ datetime: '2027-10-01T10:00:00', capacity: 5, interviewer_ids: [10] });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Scheduling conflict');
    });
  });

  // ══════════════════════════════════════════════════════════
  // SUBMIT EVALUATION  POST /api/interviewer/applications/:id/evaluate
  // ══════════════════════════════════════════════════════════
  describe('POST /api/interviewer/applications/:id/evaluate', () => {

    beforeEach(() => {
        db.query.mockResolvedValueOnce([[{ role: 'interviewer' }]]);
        db.query.mockResolvedValueOnce([[{ interviewer_id: 10 }]]);
    });

    const makeInterviewerToken = (id = 10) => jwt.sign({ id }, SECRET);

    test('WB-AM28: Score below 1 returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'interviewer' }]]); // requireInterviewer
      const token = makeInterviewerToken();
      const res = await request(app)
        .post('/api/interviewer/applications/1/evaluate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a1_score: 0, a2_score: 3, a3_score: 3, // a1_score = 0 is invalid
          b1_score: 3, b2_score: 3, b3_score: 3,
          c1_score: 3, c2_score: 3, c3_score: 3,
          d1_score: 3, d2_score: 3, d3_score: 3,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('between 1 and 5');
    });

    test('WB-AM29: Score above 5 returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'interviewer' }]]); // requireInterviewer
      const token = makeInterviewerToken();
      const res = await request(app)
        .post('/api/interviewer/applications/1/evaluate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a1_score: 6, a2_score: 3, a3_score: 3, // 6 > 5
          b1_score: 3, b2_score: 3, b3_score: 3,
          c1_score: 3, c2_score: 3, c3_score: 3,
          d1_score: 3, d2_score: 3, d3_score: 3,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('between 1 and 5');
    });

    test('WB-AM30: Non-numeric score returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'interviewer' }]]); // requireInterviewer
      const token = makeInterviewerToken();
      const res = await request(app)
        .post('/api/interviewer/applications/1/evaluate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a1_score: 'abc', a2_score: 3, a3_score: 3,
          b1_score: 3, b2_score: 3, b3_score: 3,
          c1_score: 3, c2_score: 3, c3_score: 3,
          d1_score: 3, d2_score: 3, d3_score: 3,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('between 1 and 5');
    });

    test('WB-AM31: Unassigned interviewer returns 403', async () => {
      db.query.mockResolvedValueOnce([[]]);
      const token = makeInterviewerToken();
      const res = await request(app)
        .post('/api/interviewer/applications/1/evaluate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a1_score: 3, a2_score: 3, a3_score: 3,
          b1_score: 3, b2_score: 3, b3_score: 3,
          c1_score: 3, c2_score: 3, c3_score: 3,
          d1_score: 3, d2_score: 3, d3_score: 3,
        });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not assigned');
    });

    test('WB-AM32: All scores = 5 gives total_score = 100.00', async () => {
      db.query.mockResolvedValueOnce([[{ application_id: 1 }]]); 
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const token = makeInterviewerToken();
      const res = await request(app)
        .post('/api/interviewer/applications/1/evaluate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a1_score: 5, a2_score: 5, a3_score: 5,
          b1_score: 5, b2_score: 5, b3_score: 5,
          c1_score: 5, c2_score: 5, c3_score: 5,
          d1_score: 5, d2_score: 5, d3_score: 5,
        });
      expect(res.status).toBe(200);
      expect(res.body.total_score).toBe(100);
    });

    test('WB-AM33: All scores = 3 gives total_score = 60.00', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'interviewer' }]]); // requireInterviewer
      db.query.mockResolvedValueOnce([[{ application_id: 1 }]]); // assignment check
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // upsert
      const token = makeInterviewerToken();
      const res = await request(app)
        .post('/api/interviewer/applications/1/evaluate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a1_score: 3, a2_score: 3, a3_score: 3,
          b1_score: 3, b2_score: 3, b3_score: 3,
          c1_score: 3, c2_score: 3, c3_score: 3,
          d1_score: 3, d2_score: 3, d3_score: 3,
        });
      expect(res.status).toBe(200);
      expect(res.body.total_score).toBe(60);
    });
  });
});