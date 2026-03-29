// tests/authControllers.test.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// ── Mock dependencies ────────────────────────────────────
jest.mock('../database/db');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../emails/authEmail', () => ({
  sendActivationEmail:   jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

const db = require('../database/db');
const { signup, verifyActivation, setPassword, login, forgotPassword, validateResetToken, resetPassword } =
  require('../controllers/authControllers');

// ── Helpers ───────────────────────────────────────────────
const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 1 },
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// ─────────────────────────────────────────────────────────
// signup
// ─────────────────────────────────────────────────────────
describe('signup', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – missing fields', async () => {
    const res = mockRes();
    await signup(mockReq({ body: { name: 'Alice' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
  });

  test('400 – invalid email format', async () => {
    const res = mockRes();
    await signup(mockReq({ body: { name: 'Alice', email: 'not-an-email', password: 'pass' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Please enter a valid email address.' });
  });

  test('200 – successful registration', async () => {
    bcrypt.hashSync.mockReturnValue('hashed');
    db.query.mockResolvedValue([{ insertId: 1 }]);
    const res = mockRes();
    await signup(mockReq({ body: { name: 'Alice', email: 'alice@test.com', password: 'secret' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
  });

  test('409 – duplicate email', async () => {
    bcrypt.hashSync.mockReturnValue('hashed');
    db.query.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
    const res = mockRes();
    await signup(mockReq({ body: { name: 'Alice', email: 'alice@test.com', password: 'secret' } }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'An account with this email already exists.' });
  });

  test('500 – unexpected DB error', async () => {
    bcrypt.hashSync.mockReturnValue('hashed');
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await signup(mockReq({ body: { name: 'Alice', email: 'alice@test.com', password: 'secret' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// verifyActivation
// ─────────────────────────────────────────────────────────
describe('verifyActivation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – missing fields', async () => {
    const res = mockRes();
    await verifyActivation(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('404 – token/email mismatch', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await verifyActivation(mockReq({ body: { token: 'tok', email: 'a@b.com', tempPassword: 'tmp' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('400 – account already active', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, name: 'A', password: 'h', token_expires_at: new Date(Date.now() + 60000), active_status: 'active' }]]);
    const res = mockRes();
    await verifyActivation(mockReq({ body: { token: 'tok', email: 'a@b.com', tempPassword: 'tmp' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Account already activated.' });
  });

  test('410 – expired token', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, name: 'A', password: 'h', token_expires_at: new Date(Date.now() - 1000), active_status: 'inactive' }]]);
    const res = mockRes();
    await verifyActivation(mockReq({ body: { token: 'tok', email: 'a@b.com', tempPassword: 'tmp' } }), res);
    expect(res.status).toHaveBeenCalledWith(410);
  });

  test('401 – wrong temp password', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, name: 'A', password: 'hash', token_expires_at: new Date(Date.now() + 60000), active_status: 'inactive' }]]);
    bcrypt.compareSync.mockReturnValue(false);
    const res = mockRes();
    await verifyActivation(mockReq({ body: { token: 'tok', email: 'a@b.com', tempPassword: 'wrong' } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('200 – valid activation', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, name: 'Alice', password: 'hash', token_expires_at: new Date(Date.now() + 60000), active_status: 'inactive' }]]);
    bcrypt.compareSync.mockReturnValue(true);
    jwt.sign.mockReturnValue('reset-token');
    const res = mockRes();
    await verifyActivation(mockReq({ body: { token: 'tok', email: 'a@b.com', tempPassword: 'tmp' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ resetToken: 'reset-token', name: 'Alice' }));
  });
});


// ─────────────────────────────────────────────────────────
// setPassword
// ─────────────────────────────────────────────────────────
describe('setPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – missing fields', async () => {
    const res = mockRes();
    await setPassword(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 – passwords do not match', async () => {
    const res = mockRes();
    await setPassword(mockReq({ body: { resetToken: 't', newPassword: 'Abc12345', confirmPassword: 'Different1' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Passwords do not match.' });
  });

  test('400 – weak password', async () => {
    const res = mockRes();
    await setPassword(mockReq({ body: { resetToken: 't', newPassword: 'weakpass', confirmPassword: 'weakpass' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password must be 8+ chars with one uppercase and one number.' });
  });

  test('401 – expired/invalid JWT', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('expired'); });
    const res = mockRes();
    await setPassword(mockReq({ body: { resetToken: 't', newPassword: 'Secure1234', confirmPassword: 'Secure1234' } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('403 – wrong token scope', async () => {
    jwt.verify.mockReturnValue({ id: 1, scope: 'other-scope' });
    const res = mockRes();
    await setPassword(mockReq({ body: { resetToken: 't', newPassword: 'Secure1234', confirmPassword: 'Secure1234' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('400 – user not found or already activated', async () => {
    jwt.verify.mockReturnValue({ id: 1, scope: 'set-password' });
    bcrypt.hashSync.mockReturnValue('hashed');
    db.query.mockResolvedValue([{ affectedRows: 0 }]);
    const res = mockRes();
    await setPassword(mockReq({ body: { resetToken: 't', newPassword: 'Secure1234', confirmPassword: 'Secure1234' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('200 – password set successfully', async () => {
    jwt.verify.mockReturnValue({ id: 1, scope: 'set-password' });
    bcrypt.hashSync.mockReturnValue('hashed');
    db.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = mockRes();
    await setPassword(mockReq({ body: { resetToken: 't', newPassword: 'Secure1234', confirmPassword: 'Secure1234' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password set successfully. You can now log in.' });
  });
});


// ─────────────────────────────────────────────────────────
// login
// ─────────────────────────────────────────────────────────
describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('401 – user not found', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await login(mockReq({ body: { email: 'a@b.com', password: 'pass' } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password.' });
  });

  test('403 – inactive account', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, password: 'h', active_status: 'inactive', name: 'A', email: 'a@b.com', role: 'applicant' }]]);
    const res = mockRes();
    await login(mockReq({ body: { email: 'a@b.com', password: 'pass' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('not activated') }));
  });

  test('403 – suspended account', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, password: 'h', active_status: 'suspended', name: 'A', email: 'a@b.com', role: 'applicant' }]]);
    const res = mockRes();
    await login(mockReq({ body: { email: 'a@b.com', password: 'pass' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('suspended') }));
  });

  test('401 – wrong password', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, password: 'h', active_status: 'active', name: 'A', email: 'a@b.com', role: 'applicant' }]]);
    bcrypt.compareSync.mockReturnValue(false);
    const res = mockRes();
    await login(mockReq({ body: { email: 'a@b.com', password: 'wrong' } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('200 – successful login returns token', async () => {
    db.query
      .mockResolvedValueOnce([[{ user_id: 1, password: 'h', active_status: 'active', name: 'Alice', email: 'a@b.com', role: 'applicant' }]])
      .mockResolvedValueOnce([{}]);
    bcrypt.compareSync.mockReturnValue(true);
    jwt.sign.mockReturnValue('jwt-token');
    const res = mockRes();
    await login(mockReq({ body: { email: 'a@b.com', password: 'pass' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token', role: 'applicant' }));
  });
});


// ─────────────────────────────────────────────────────────
// forgotPassword
// ─────────────────────────────────────────────────────────
describe('forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 – generic message even when email not found (no enumeration)', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await forgotPassword(mockReq({ body: { email: 'unknown@x.com' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'If an account with that email exists, a reset link has been sent.' });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('200 – email found, token stored and email sent', async () => {
    db.query
      .mockResolvedValueOnce([[{ user_id: 5, name: 'Bob' }]])
      .mockResolvedValueOnce([{}]);
    const res = mockRes();
    await forgotPassword(mockReq({ body: { email: 'bob@x.com' } }), res);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ message: 'If an account with that email exists, a reset link has been sent.' });
  });
});


// ─────────────────────────────────────────────────────────
// validateResetToken
// ─────────────────────────────────────────────────────────
describe('validateResetToken', () => {
  beforeEach(() => jest.clearAllMocks());

  test('404 – invalid token', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await validateResetToken(mockReq({ body: { token: 'bad' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('410 – expired token', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, token_expires_at: new Date(Date.now() - 1000) }]]);
    const res = mockRes();
    await validateResetToken(mockReq({ body: { token: 'expired' } }), res);
    expect(res.status).toHaveBeenCalledWith(410);
  });

  test('200 – valid token', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, token_expires_at: new Date(Date.now() + 60000) }]]);
    const res = mockRes();
    await validateResetToken(mockReq({ body: { token: 'valid' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is valid.' });
  });
});


// ─────────────────────────────────────────────────────────
// resetPassword
// ─────────────────────────────────────────────────────────
describe('resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – missing fields', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 – passwords do not match', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ body: { token: 't', newPassword: 'Abc12345', confirmPassword: 'Other123' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Passwords do not match.' });
  });

  test('400 – weak password', async () => {
    const res = mockRes();
    await resetPassword(mockReq({ body: { token: 't', newPassword: 'weakpass', confirmPassword: 'weakpass' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('404 – token not found', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await resetPassword(mockReq({ body: { token: 't', newPassword: 'Secure123', confirmPassword: 'Secure123' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('410 – expired token', async () => {
    db.query.mockResolvedValue([[{ user_id: 1, token_expires_at: new Date(Date.now() - 1000) }]]);
    const res = mockRes();
    await resetPassword(mockReq({ body: { token: 't', newPassword: 'Secure123', confirmPassword: 'Secure123' } }), res);
    expect(res.status).toHaveBeenCalledWith(410);
  });

  test('200 – password reset successfully', async () => {
    db.query
      .mockResolvedValueOnce([[{ user_id: 1, token_expires_at: new Date(Date.now() + 60000) }]])
      .mockResolvedValueOnce([{}]);
    bcrypt.hashSync.mockReturnValue('hashed');
    const res = mockRes();
    await resetPassword(mockReq({ body: { token: 't', newPassword: 'Secure123', confirmPassword: 'Secure123' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully. You can now log in.' });
  });
});