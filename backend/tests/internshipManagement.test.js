'use strict';
// ─────────────────────────────────────────────────────────
// tests/internshipManagement.test.js
// White Box Tests — Internship Management Module
// Run: npx jest tests/internshipManagement.test.js
// ─────────────────────────────────────────────────────────

process.env.JWT_SECRET = 'test_secret_key';

jest.mock('../database/db');
jest.mock('../emails/internshipEmail', () => ({ sendInternshipStatusEmail: jest.fn() }));
jest.mock('multer', () => {
  const m = () => ({
    single: () => (_req, _res, next) => { _req.file = { path: '/tmp/resume.pdf', filename: 'resume.pdf', mimetype: 'application/pdf' }; next(); },
    fields: () => (_req, _res, next) => { _req.files = { resume: [{ path: '/tmp/resume.pdf', filename: 'resume.pdf', mimetype: 'application/pdf' }] }; next(); },
  });
  m.diskStorage = () => ({});
  return m;
});

const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../database/db');

const vacancyRoutes       = require('../routes/vacancyRoutes');
const internshipRoutes    = require('../routes/internshipRoutes');
const internshipAppRoutes = require('../routes/internshipApplicationRoutes');
const terminationRoutes   = require('../routes/terminationRoutes');
const adminRoutes         = require('../routes/adminRoutes');

const app = express();
app.use(express.json());
app.use('/api', vacancyRoutes);
app.use('/api', internshipRoutes);
app.use('/api', internshipAppRoutes);
app.use('/api', terminationRoutes);
app.use('/api', adminRoutes);

const SECRET              = 'test_secret_key';
const makePartnerToken    = (id = 1) => jwt.sign({ id }, SECRET);
const makeStudentToken    = (id = 2) => jwt.sign({ id }, SECRET);
const makeSupervisorToken = (id = 3) => jwt.sign({ id }, SECRET);
const makeAdminToken      = (id = 4) => jwt.sign({ id }, SECRET);

describe('Internship Management — White Box Tests', () => {
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
  // CREATE VACANCY  POST /api/partner/internship-vacancies
  // ══════════════════════════════════════════════════════════
  describe('POST /api/partner/internship-vacancies', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ role: 'industry_partner' }]]);
      db.query.mockResolvedValueOnce([[{ partner_id: 10 }]]);
    });

    test('WB-IM01: Missing position_name returns 400', async () => {
      const res = await request(app).post('/api/partner/internship-vacancies')
        .set('Authorization', `Bearer ${makePartnerToken()}`)
        .send({ capacity: 5, start_date: '2025-09-01', end_date: '2025-12-31' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Position name');
    });

    test('WB-IM02: Capacity = 0 returns 400', async () => {
      const res = await request(app).post('/api/partner/internship-vacancies')
        .set('Authorization', `Bearer ${makePartnerToken()}`)
        .send({ position_name: 'Dev', capacity: 0, start_date: '2025-09-01', end_date: '2025-12-31' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('positive number');
    });

    test('WB-IM03: start_date >= end_date returns 400', async () => {
      const res = await request(app).post('/api/partner/internship-vacancies')
        .set('Authorization', `Bearer ${makePartnerToken()}`)
        .send({ position_name: 'Dev', capacity: 3, start_date: '2025-12-31', end_date: '2025-09-01' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('End date must be after');
    });

    test('WB-IM04: Invalid status value returns 400', async () => {
      const res = await request(app).post('/api/partner/internship-vacancies')
        .set('Authorization', `Bearer ${makePartnerToken()}`)
        .send({ position_name: 'Dev', capacity: 3, start_date: '2025-09-01', end_date: '2025-12-31', status: 'pending' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('open or closed');
    });
  });

  // ══════════════════════════════════════════════════════════
  // UPDATE VACANCY  PUT /api/partner/internship-vacancies/:id
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/partner/internship-vacancies/:id', () => {

    test('WB-IM05: Vacancy not found (wrong partner) returns 404', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'industry_partner' }]]);
      db.query.mockResolvedValueOnce([[{ partner_id: 10 }]]);
      db.query.mockResolvedValueOnce([[]]); // not found
      const res = await request(app).put('/api/partner/internship-vacancies/999')
        .set('Authorization', `Bearer ${makePartnerToken()}`)
        .send({ position_name: 'Updated' });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Vacancy not found.');
    });

    test('WB-IM06: No valid fields to update returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'industry_partner' }]]);
      db.query.mockResolvedValueOnce([[{ partner_id: 10 }]]);
      db.query.mockResolvedValueOnce([[{ start_date: '2025-09-01', end_date: '2025-12-31' }]]);
      const res = await request(app).put('/api/partner/internship-vacancies/1')
        .set('Authorization', `Bearer ${makePartnerToken()}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No valid fields');
    });
  });

  // ══════════════════════════════════════════════════════════
  // APPLY VACANCY  POST /api/student/internship-apply
  // ══════════════════════════════════════════════════════════
  describe('POST /api/student/internship-apply', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ student_id: 20 }]]); // getStudentId
    });

    test('WB-IM07: Missing vacancy_id returns 400', async () => {
      const res = await request(app).post('/api/student/internship-apply')
        .set('Authorization', `Bearer ${makeStudentToken()}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('vacancy_id is required.');
    });

    test('WB-IM08: Non-existent vacancy returns 404', async () => {
      db.query.mockResolvedValueOnce([[]]); // vacancy not found
      const res = await request(app).post('/api/student/internship-apply')
        .set('Authorization', `Bearer ${makeStudentToken()}`).send({ vacancy_id: 999 });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Vacancy not found.');
    });

    test('WB-IM09: Closed vacancy returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ vacancy_id: 1, partner_id: 10, status: 'closed' }]]);
      const res = await request(app).post('/api/student/internship-apply')
        .set('Authorization', `Bearer ${makeStudentToken()}`).send({ vacancy_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('no longer open');
    });

    test('WB-IM10: Duplicate application returns 409', async () => {
      db.query
        .mockResolvedValueOnce([[{ vacancy_id: 1, partner_id: 10, status: 'open' }]])
        .mockResolvedValueOnce([[{ internship_application_id: 5 }]]);
      const res = await request(app).post('/api/student/internship-apply')
        .set('Authorization', `Bearer ${makeStudentToken()}`).send({ vacancy_id: 1 });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already applied');
    });
  });

  // ══════════════════════════════════════════════════════════
  // ACCEPT OFFER  POST /api/student/internship-accept/:id
  // ══════════════════════════════════════════════════════════
  describe('POST /api/student/internship-accept/:id', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ student_id: 20 }]]); // getStudentId
    });

    test('WB-IM11: Application not found returns 404', async () => {
      mockConn.query.mockResolvedValueOnce([[]]); // empty
      const res = await request(app).post('/api/student/internship-accept/999')
        .set('Authorization', `Bearer ${makeStudentToken()}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Application not found.');
    });

    test('WB-IM12: Status not passed returns 400', async () => {
      mockConn.query.mockResolvedValueOnce([[{
        internship_application_id: 1, application_status: 'pending',
        internship_applicant_response: 'none', capacity: 5, vacancy_id: 1,
        position_name: 'Dev', company_name: 'Tech', student_email: 'a@mail.com', student_name: 'Ali'
      }]]);
      const res = await request(app).post('/api/student/internship-accept/1')
        .set('Authorization', `Bearer ${makeStudentToken()}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('"passed"');
    });

    test('WB-IM13: Already responded returns 400', async () => {
      mockConn.query.mockResolvedValueOnce([[{
        internship_application_id: 1, application_status: 'passed',
        internship_applicant_response: 'declined', capacity: 5, vacancy_id: 1,
        position_name: 'Dev', company_name: 'Tech', student_email: 'a@mail.com', student_name: 'Ali'
      }]]);
      const res = await request(app).post('/api/student/internship-accept/1')
        .set('Authorization', `Bearer ${makeStudentToken()}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already responded');
    });

    test('WB-IM14: No vacancy slots remaining returns 409', async () => {
      mockConn.query.mockResolvedValueOnce([[{
        internship_application_id: 1, application_status: 'passed',
        internship_applicant_response: 'none', capacity: 0, vacancy_id: 1,
        position_name: 'Dev', company_name: 'Tech', student_email: 'a@mail.com', student_name: 'Ali'
      }]]);
      const res = await request(app).post('/api/student/internship-accept/1')
        .set('Authorization', `Bearer ${makeStudentToken()}`);
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('No slots remaining');
    });

    test('WB-IM15: Student already has active internship returns 409', async () => {
      mockConn.query
        .mockResolvedValueOnce([[{
          internship_application_id: 1, application_status: 'passed',
          internship_applicant_response: 'none', capacity: 5, vacancy_id: 1,
          position_name: 'Dev', company_name: 'Tech', student_email: 'a@mail.com', student_name: 'Ali'
        }]])
        .mockResolvedValueOnce([[{ internship_application_id: 2 }]]);
      const res = await request(app).post('/api/student/internship-accept/1')
        .set('Authorization', `Bearer ${makeStudentToken()}`);
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already have an active internship');
    });
  });

  // ══════════════════════════════════════════════════════════
  // DECLINE OFFER  POST /api/student/internship-decline/:id
  // ══════════════════════════════════════════════════════════
  describe('POST /api/student/internship-decline/:id', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ student_id: 20 }]]); // getStudentId
    });

    test('WB-IM16: Status not passed returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ application_status: 'pending', internship_applicant_response: 'none' }]]);
      const res = await request(app).post('/api/student/internship-decline/1')
        .set('Authorization', `Bearer ${makeStudentToken()}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('"passed"');
    });
  });

  // ══════════════════════════════════════════════════════════
  // REQUEST WITHDRAW  POST /api/student/internship-withdraw/:id
  // ══════════════════════════════════════════════════════════
  describe('POST /api/student/internship-withdraw/:id', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ student_id: 20 }]]); // getStudentId
    });

    test('WB-IM17: Response not accepted returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ application_status: 'passed', internship_applicant_response: 'none' }]]);
      const res = await request(app).post('/api/student/internship-withdraw/1')
        .set('Authorization', `Bearer ${makeStudentToken()}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('only withdraw an accepted');
    });
  });

  // ══════════════════════════════════════════════════════════
  // PARTNER UPDATE STATUS  PUT /api/partner/internship-applications/:id/status
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/partner/internship-applications/:id/status', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ role: 'industry_partner' }]]);
      db.query.mockResolvedValueOnce([[{ partner_id: 10 }]]);
    });

    test('WB-IM18: pending → interview requires datetime and location', async () => {
      mockConn.query.mockResolvedValueOnce([[{
        internship_application_id: 1, current_status: 'pending',
        student_name: 'Ali', student_email: 'a@mail.com', position_name: 'Dev', company_name: 'Tech'
      }]]);
      const res = await request(app).put('/api/partner/internship-applications/1/status')
        .set('Authorization', `Bearer ${makePartnerToken()}`).send({ status: 'interview' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Interview date');
    });

    test('WB-IM19: Invalid transition (pending → passed) returns 400', async () => {
      mockConn.query.mockResolvedValueOnce([[{
        internship_application_id: 1, current_status: 'pending',
        student_name: 'Ali', student_email: 'a@mail.com', position_name: 'Dev', company_name: 'Tech'
      }]]);
      const res = await request(app).put('/api/partner/internship-applications/1/status')
        .set('Authorization', `Bearer ${makePartnerToken()}`).send({ status: 'passed' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be one of');
    });
  });

  // ══════════════════════════════════════════════════════════
  // ASSIGN SUPERVISOR
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/partner/internship-applications/:id/assign-supervisor', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ role: 'industry_partner' }]]);
      db.query.mockResolvedValueOnce([[{ partner_id: 10 }]]);
    });

    test('WB-IM20: Missing supervisor_id returns 400', async () => {
      const res = await request(app).put('/api/partner/internship-applications/1/assign-supervisor')
        .set('Authorization', `Bearer ${makePartnerToken()}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('supervisor_id is required');
    });

    test('WB-IM21: Application not accepted returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ internship_application_status: 'passed', internship_applicant_response: 'none' }]]);
      const res = await request(app).put('/api/partner/internship-applications/1/assign-supervisor')
        .set('Authorization', `Bearer ${makePartnerToken()}`).send({ supervisor_id: 5 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('active intern');
    });

    test('WB-IM22: Supervisor from different partner returns 403', async () => {
      db.query
        .mockResolvedValueOnce([[{
          internship_application_id: 1, application_status: 'passed',
          internship_application_status: 'passed', internship_applicant_response: 'accepted', intern_status: 'active',
        }]])
        .mockResolvedValueOnce([[]]); // supervisor not under this partner
      const res = await request(app).put('/api/partner/internship-applications/1/assign-supervisor')
        .set('Authorization', `Bearer ${makePartnerToken()}`).send({ supervisor_id: 99 });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not found under your company');
    });
  });

  // ══════════════════════════════════════════════════════════
  // BULK ASSIGN SUPERVISOR
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/partner/internship-applications/bulk-assign-supervisor', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ role: 'industry_partner' }]]);
      db.query.mockResolvedValueOnce([[{ partner_id: 10 }]]);
    });

    test('WB-IM23: Empty application_ids returns 400', async () => {
      const res = await request(app).put('/api/partner/internship-applications/bulk-assign-supervisor')
        .set('Authorization', `Bearer ${makePartnerToken()}`).send({ application_ids: [], supervisor_id: 5 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('non-empty array');
    });
  });

  // ══════════════════════════════════════════════════════════
  // SUBMIT TERMINATION  POST /api/supervisor/termination-form
  // ══════════════════════════════════════════════════════════
  describe('POST /api/supervisor/termination-form', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ role: 'industry_supervisor' }]]);
      db.query.mockResolvedValueOnce([[{ supervisor_id: 30 }]]);
    });

    test('WB-IM24: Missing internship_application_id returns 400', async () => {
      const res = await request(app).post('/api/supervisor/termination-form')
        .set('Authorization', `Bearer ${makeSupervisorToken()}`)
        .send({ reason: 'Poor performance', details: 'Details here', last_working_date: '2025-10-01' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Please select a student.');
    });

    test('WB-IM25: Missing reason returns 400', async () => {
      const res = await request(app).post('/api/supervisor/termination-form')
        .set('Authorization', `Bearer ${makeSupervisorToken()}`)
        .send({ internship_application_id: 1, reason: '', details: 'Details', last_working_date: '2025-10-01' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('reason is required');
    });

    test('WB-IM26: Duplicate active termination returns 409', async () => {
      db.query
        .mockResolvedValueOnce([[{ internship_application_id: 1, student_name: 'Ali', position_name: 'Dev', company_name: 'Tech' }]])
        .mockResolvedValueOnce([[{ termination_id: 5 }]]);
      const res = await request(app).post('/api/supervisor/termination-form')
        .set('Authorization', `Bearer ${makeSupervisorToken()}`)
        .send({ internship_application_id: 1, reason: 'Poor performance', details: 'Details here', last_working_date: '2025-10-01' });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ══════════════════════════════════════════════════════════
  // PROCESS TERMINATION  PUT /api/admin/internship/termination-requests/:id
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/admin/internship/termination-requests/:id', () => {
    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]);
    });

    test('WB-IM27: Invalid decision returns 400', async () => {
      const res = await request(app).put('/api/admin/internship/termination-requests/1')
        .set('Authorization', `Bearer ${makeAdminToken()}`).send({ decision: 'cancel' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('"approved" or "rejected"');
    });

    test('WB-IM28: Termination not found returns 404', async () => {
      mockConn.query.mockResolvedValueOnce([[]]); // not found
      const res = await request(app).put('/api/admin/internship/termination-requests/999')
        .set('Authorization', `Bearer ${makeAdminToken()}`).send({ decision: 'approved' });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Termination request not found.');
    });

    test('WB-IM29: Already processed termination returns 400', async () => {
      mockConn.query.mockResolvedValueOnce([[{
        termination_id: 1, status: 'approved', internship_application_id: 5,
        supervisor_email: 's@mail.com', supervisor_name: 'Sup',
        student_name: 'Ali', position_name: 'Dev', company_name: 'Tech',
      }]]);
      const res = await request(app).put('/api/admin/internship/termination-requests/1')
        .set('Authorization', `Bearer ${makeAdminToken()}`).send({ decision: 'rejected' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already');
    });

    test('WB-IM30: Approved termination sets application status to terminated', async () => {
      mockConn.query
        .mockResolvedValueOnce([[{
          termination_id: 1, status: 'pending', internship_application_id: 5,
          supervisor_email: 's@mail.com', supervisor_name: 'Sup',
          student_name: 'Ali', position_name: 'Dev', company_name: 'Tech'
        }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await request(app).put('/api/admin/internship/termination-requests/1')
        .set('Authorization', `Bearer ${makeAdminToken()}`).send({ decision: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('approved');
      const updateAppCall = mockConn.query.mock.calls.find(c =>
        typeof c[0] === 'string' && c[0].includes('terminated')
      );
      expect(updateAppCall).toBeDefined();
    });
  });
});