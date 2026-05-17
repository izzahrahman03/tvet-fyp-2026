'use strict';
// ─────────────────────────────────────────────────────────
// tests/userManagement.test.js
// White Box Tests — User Management Module
// Run: npx jest tests/userManagement.test.js
// ─────────────────────────────────────────────────────────

process.env.JWT_SECRET = 'test_secret_key';

// ── Mocks ─────────────────────────────────────────────────
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());
jest.mock('../database/db');
jest.mock('../emails/authEmail', () => ({
  sendActivationEmail:    jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));
jest.mock('../emails/adminEmail', () => ({
  sendBulkActivationEmail:    jest.fn(),
  sendApplicationStatusEmail: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────
const request = require('supertest');
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database/db');

const authRoutes    = require('../routes/authRoutes');
const adminRoutes   = require('../routes/adminRoutes');
const profileRoutes = require('../routes/profileRoutes');

// ── Test App ──────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', profileRoutes);

// ── Helpers ───────────────────────────────────────────────
const SECRET    = 'test_secret_key';
const makeToken = (id = 1) => jwt.sign({ id }, SECRET);
const HASH      = bcrypt.hashSync('Password1', 8);

// ─────────────────────────────────────────────────────────
describe('User Management — White Box Tests', () => {
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
  // SIGNUP  POST /api/signup
  // ══════════════════════════════════════════════════════════
  describe('POST /api/signup', () => {

    test('WB-UMM01: Missing fields returns 400', async () => {
      const res = await request(app)
        .post('/api/signup')
        .send({ name: 'Ali' }); // missing email and password
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('All fields are required');
    });

    test('WB-UMM02: Valid email and all fields returns 200', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 1 }]);
      const res = await request(app)
        .post('/api/signup')
        .send({ name: 'Ali', email: 'ali@mail.com', password: 'Password1' });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User registered successfully');
    });

    test('WB-UMM03: Invalid email format returns 400', async () => {
      const res = await request(app)
        .post('/api/signup')
        .send({ name: 'Ali', email: 'notanemail', password: 'Password1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Please enter a valid email address.');
    });

    test('WB-UMM04: Duplicate email triggers ER_DUP_ENTRY and returns 409', async () => {
      const dupErr = Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' });
      db.query.mockRejectedValueOnce(dupErr);
      const res = await request(app)
        .post('/api/signup')
        .send({ name: 'Ali', email: 'ali@mail.com', password: 'Password1' });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ══════════════════════════════════════════════════════════
  // SET PASSWORD  POST /api/set-password
  // ══════════════════════════════════════════════════════════
  describe('POST /api/set-password', () => {
    const validToken = jwt.sign({ id: 1, scope: 'set-password' }, SECRET, { expiresIn: '15m' });

    test('WB-UMM05: Valid password and scope updates account and returns 200', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await request(app)
        .post('/api/set-password')
        .send({ resetToken: validToken, newPassword: 'Password1', confirmPassword: 'Password1' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('successfully');
    });

    test('WB-UMM06: Password with no uppercase returns 400', async () => {
      const res = await request(app)
        .post('/api/set-password')
        .send({ resetToken: validToken, newPassword: 'password1', confirmPassword: 'password1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('uppercase');
    });

    test('WB-UMM07: Password with no digit returns 400', async () => {
      const res = await request(app)
        .post('/api/set-password')
        .send({ resetToken: validToken, newPassword: 'PasswordABC', confirmPassword: 'PasswordABC' });
      expect(res.status).toBe(400);
    });

    test('WB-UMM08: Password shorter than 8 chars returns 400', async () => {
      const res = await request(app)
        .post('/api/set-password')
        .send({ resetToken: validToken, newPassword: 'Pass1', confirmPassword: 'Pass1' });
      expect(res.status).toBe(400);
    });

    test('WB-UMM09: Mismatched passwords returns 400', async () => {
      const res = await request(app)
        .post('/api/set-password')
        .send({ resetToken: validToken, newPassword: 'Password1', confirmPassword: 'Password2' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Passwords do not match.');
    });

    test('WB-UMM10: Wrong JWT scope returns 403', async () => {
      const wrongScope = jwt.sign({ id: 1, scope: 'login' }, SECRET);
      const res = await request(app)
        .post('/api/set-password')
        .send({ resetToken: wrongScope, newPassword: 'Password1', confirmPassword: 'Password1' });
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Invalid token scope.');
    });

    test('WB-UMM11: Expired JWT returns 401', async () => {
      const expired = jwt.sign({ id: 1, scope: 'set-password' }, SECRET, { expiresIn: '-1s' });
      const res = await request(app)
        .post('/api/set-password')
        .send({ resetToken: expired, newPassword: 'Password1', confirmPassword: 'Password1' });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('expired');
    });

    test('WB-UMM12: Account not found or already active returns 400', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
      const res = await request(app)
        .post('/api/set-password')
        .send({ resetToken: validToken, newPassword: 'Password1', confirmPassword: 'Password1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already activated');
    });
  });

  // ══════════════════════════════════════════════════════════
  // VERIFY ACTIVATION  POST /api/verify-activation
  // ══════════════════════════════════════════════════════════
  describe('POST /api/verify-activation', () => {

    test('WB-UMMM13: Already active account returns 400', async () => {
      db.query.mockResolvedValueOnce([[{
        user_id: 1, active_status: 'active',
        token_expires_at: new Date(Date.now() + 60000),
        password: HASH, name: 'Ali',
      }]]);
      const res = await request(app)
        .post('/api/verify-activation')
        .send({ token: 'abc', email: 'a@mail.com', tempPassword: 'TempPass1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Account already activated.');
    });

    test('WB-UMMM14: Expired activation token returns 410', async () => {
      db.query.mockResolvedValueOnce([[{
        user_id: 1, active_status: 'inactive',
        token_expires_at: new Date(Date.now() - 60000), // expired
        password: HASH, name: 'Ali',
      }]]);
      const res = await request(app)
        .post('/api/verify-activation')
        .send({ token: 'abc', email: 'a@mail.com', tempPassword: 'TempPass1' });
      expect(res.status).toBe(410);
      expect(res.body.message).toContain('expired');
    });

    test('WB-UMMM15: Wrong temporary password returns 401', async () => {
      db.query.mockResolvedValueOnce([[{
        user_id: 1, active_status: 'inactive',
        token_expires_at: new Date(Date.now() + 60000),
        password: HASH, name: 'Ali',
      }]]);
      const res = await request(app)
        .post('/api/verify-activation')
        .send({ token: 'abc', email: 'a@mail.com', tempPassword: 'WrongPass1' });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Incorrect');
    });
  });

  // ══════════════════════════════════════════════════════════
  // LOGIN  POST /api/login
  // ══════════════════════════════════════════════════════════
  describe('POST /api/login', () => {

    test('WB-UMM16: User not found returns 401 with generic message', async () => {
      db.query.mockResolvedValueOnce([[]]); // no user found
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'notfound@mail.com', password: 'Password1' });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    test('WB-UMM17: Inactive account returns 403', async () => {
      db.query.mockResolvedValueOnce([[{ user_id: 1, password: HASH, active_status: 'inactive', role: 'applicant', name: 'Ali' }]]);
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'ali@mail.com', password: 'Password1' });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('activated');
    });

    test('WB-UMM18: Suspended account returns 403', async () => {
      db.query.mockResolvedValueOnce([[{ user_id: 1, password: HASH, active_status: 'suspended', role: 'applicant', name: 'Ali' }]]);
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'ali@mail.com', password: 'Password1' });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('suspended');
    });

    test('WB-UMM19: Wrong password returns 401 with same generic message', async () => {
      db.query.mockResolvedValueOnce([[{ user_id: 1, password: HASH, active_status: 'active', role: 'applicant', name: 'Ali' }]]);
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'ali@mail.com', password: 'WrongPass1' });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    test('WB-UMM20: Student login returns matric number in response', async () => {
      db.query
        .mockResolvedValueOnce([[{ user_id: 2, password: HASH, active_status: 'active', role: 'student', name: 'Siti' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])               // ← UPDATE last_login first
        .mockResolvedValueOnce([[{ matric_number: 'STU2025001' }]]); // ← then student lookup
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'siti@mail.com', password: 'Password1' });
      expect(res.status).toBe(200);
      expect(res.body.matricNumber).toBe('STU2025001');
    });

    test('WB-UMM21: Successful login returns JWT token', async () => {
      db.query.mockResolvedValueOnce([[{ user_id: 1, password: HASH, active_status: 'active', role: 'admin', name: 'Admin' }]]);
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'admin@mail.com', password: 'Password1' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════
  // FORGOT PASSWORD  POST /api/forgot-password
  // ══════════════════════════════════════════════════════════
  describe('POST /api/forgot-password', () => {

    test('WB-UMM22: Unregistered email returns 200 (anti-enumeration)', async () => {
      db.query.mockResolvedValueOnce([[]]); // no user
      const res = await request(app)
        .post('/api/forgot-password')
        .send({ email: 'notfound@mail.com' });
      expect(res.status).toBe(200);
    });

    test('WB-UMM23: Registered email returns same 200 message', async () => {
      db.query
        .mockResolvedValueOnce([[{ user_id: 1, name: 'Ali', email: 'ali@mail.com' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await request(app)
        .post('/api/forgot-password')
        .send({ email: 'ali@mail.com' });
      expect(res.status).toBe(200);
    });
  });

  // ══════════════════════════════════════════════════════════
  // RESET PASSWORD  POST /api/reset-password
  // ══════════════════════════════════════════════════════════
  describe('POST /api/reset-password', () => {

    test('WB-UMM24: Expired reset token returns 410', async () => {
      db.query.mockResolvedValueOnce([[{
        user_id: 1,
        token_expires_at: new Date(Date.now() - 60000) // ← expired timestamp
      }]]);
      const res = await request(app)
        .post('/api/reset-password')
        .send({ token: 'expiredtoken', newPassword: 'NewPass1', confirmPassword: 'NewPass1' });
      expect(res.status).toBe(410);
    });

    test('WB-UM25: Mismatched passwords returns 400', async () => {
      const res = await request(app)
        .post('/api/reset-password')
        .send({ token: 'sometoken', newPassword: 'NewPass1', confirmPassword: 'DiffPass1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('match');
    });

    test('WB-UM26: Weak password returns 400', async () => {
      const res = await request(app)
        .post('/api/reset-password')
        .send({ token: 'sometoken', newPassword: 'weakpass', confirmPassword: 'weakpass' });
      expect(res.status).toBe(400);
    });
  });

  // ══════════════════════════════════════════════════════════
  // verifyToken MIDDLEWARE
  // ══════════════════════════════════════════════════════════
  describe('verifyToken middleware', () => {

    test('WB-UM27: No Authorization header returns 401', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('No token');
    });

    test('WB-UM28: Invalid JWT token returns 401', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
    });
  });

  // ══════════════════════════════════════════════════════════
  // requireAdmin MIDDLEWARE
  // ══════════════════════════════════════════════════════════
  describe('requireAdmin middleware', () => {

    test('WB-UM29: Non-admin role returns 403', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'student' }]]);
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${makeToken(5)}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admins only');
    });
  });

  // ══════════════════════════════════════════════════════════
  // UPDATE PROFILE  PUT /api/profile
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/profile', () => {

    test('WB-UM30: Missing name returns 400', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ name: '', email: 'ali@mail.com' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('WB-UM31: Invalid email format returns 400', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ name: 'Ali', email: 'bademail' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid email');
    });

    test('WB-UM32: Duplicate email returns 409', async () => {
      db.query.mockResolvedValueOnce([[{ user_id: 99 }]]); // another user owns the email
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ name: 'Ali', email: 'taken@mail.com' });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already in use');
    });
  });

  // ══════════════════════════════════════════════════════════
  // UPDATE PASSWORD  PUT /api/profile/password
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/profile/password', () => {

    test('WB-UM33: Missing password fields returns 400', async () => {
      const res = await request(app)
        .put('/api/profile/password')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ currentPassword: 'Password1' }); // missing newPassword and confirmPassword
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('WB-UM34: Wrong current password returns 401', async () => {
      db.query.mockResolvedValueOnce([[{ password: HASH }]]);
      const res = await request(app)
        .put('/api/profile/password')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ currentPassword: 'WrongCurrent1', newPassword: 'NewPass1', confirmPassword: 'NewPass1' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Current password is incorrect.');
    });

    test('WB-UM35: New password same as current returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ password: HASH }]]);
      const res = await request(app)
        .put('/api/profile/password')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ currentPassword: 'Password1', newPassword: 'Password1', confirmPassword: 'Password1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('different');
    });

    test('WB-UM36: Passwords do not match returns 400', async () => {
      const res = await request(app)
        .put('/api/profile/password')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ currentPassword: 'Password1', newPassword: 'NewPass1', confirmPassword: 'DiffPass1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Passwords do not match.');
    });
  });

  // ══════════════════════════════════════════════════════════
  // ADMIN ADD USER  POST /api/admin/users
  // ══════════════════════════════════════════════════════════
  describe('POST /api/admin/users', () => {

    beforeEach(() => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdmin
    });

    test('WB-UM37: Missing name/email/role returns 400', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ email: 'test@mail.com' }); // missing name and role
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    test('WB-UM38: Invalid role (applicant) returns 400', async () => {
      mockConn.query.mockResolvedValueOnce([[]]); // no duplicate
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ name: 'Test', email: 'test@mail.com', role: 'applicant' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Role must be');
    });

    test('WB-UM39: Duplicate email returns 409', async () => {
      mockConn.query.mockResolvedValueOnce([[{ user_id: 99 }]]); // email already exists
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ name: 'Test', email: 'exists@mail.com', role: 'industry_partner' });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ══════════════════════════════════════════════════════════
  // ADMIN DELETE USER  DELETE /api/admin/users/:id
  // ══════════════════════════════════════════════════════════
  describe('DELETE /api/admin/users/:id', () => {

    test('WB-UM40: Non-existent user returns 404', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'admin' }]])   // requireAdmin
        .mockResolvedValueOnce([{ affectedRows: 0 }]);  // delete finds nothing
      const res = await request(app)
        .delete('/api/admin/users/999')
        .set('Authorization', `Bearer ${makeToken(1)}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found.');
    });

    test('WB-UM41: Valid user_id deletes successfully', async () => {
      db.query
        .mockResolvedValueOnce([[{ role: 'admin' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await request(app)
        .delete('/api/admin/users/5')
        .set('Authorization', `Bearer ${makeToken(1)}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });
  });
  // ══════════════════════════════════════════════════════════
  // ADMIN UPDATE USER  PUT /api/admin/users/:id
  // ══════════════════════════════════════════════════════════
  describe('PUT /api/admin/users/:id', () => {

    test('WB-UM42: No valid fields to update returns 400', async () => {
      db.query.mockResolvedValueOnce([[{ role: 'admin' }]]); // requireAdmin
      mockConn.query.mockResolvedValueOnce();                // beginTransaction
      const res = await request(app)
        .put('/api/admin/users/5?role=applicant')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ unknownField: 'value' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No valid fields');
    });
  });
});