// tests/profileControllers.test.js

jest.mock('../database/db');
jest.mock('bcryptjs');

const db     = require('../database/db');
const bcrypt = require('bcryptjs');
const { getProfile, updateProfile, updatePassword } = require('../controllers/profileControllers');

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
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
// getProfile
// ─────────────────────────────────────────────────────────
describe('getProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 – returns user data', async () => {
    const fakeUser = { id: 1, name: 'Alice', email: 'a@b.com', role: 'applicant', active_status: 'active', created_at: new Date() };
    db.query.mockResolvedValue([[fakeUser]]);
    const res = mockRes();
    await getProfile(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({ user: fakeUser });
  });

  test('404 – user not found', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await getProfile(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getProfile(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// updateProfile
// ─────────────────────────────────────────────────────────
describe('updateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – missing name or email', async () => {
    const res = mockRes();
    await updateProfile(mockReq({ body: { name: '', email: '' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Name and email are required.' });
  });

  test('400 – invalid email format', async () => {
    const res = mockRes();
    await updateProfile(mockReq({ body: { name: 'Alice', email: 'bad-email' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email address.' });
  });

  test('409 – email already in use by another account', async () => {
    db.query.mockResolvedValue([[{ user_id: 99 }]]); // another user has this email
    const res = mockRes();
    await updateProfile(mockReq({ body: { name: 'Alice', email: 'taken@b.com' } }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'This email is already in use by another account.' });
  });

  test('200 – profile updated successfully', async () => {
    db.query
      .mockResolvedValueOnce([[]])                // no conflicting email
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // update succeeded
    const res = mockRes();
    await updateProfile(mockReq({ body: { name: 'Alice', email: 'alice@new.com' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile updated successfully.' }));
  });

  test('404 – user not found on update', async () => {
    db.query
      .mockResolvedValueOnce([[]])                // no conflicting email
      .mockResolvedValueOnce([{ affectedRows: 0 }]); // no row updated
    const res = mockRes();
    await updateProfile(mockReq({ body: { name: 'Alice', email: 'alice@new.com' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('409 – race-condition ER_DUP_ENTRY on UPDATE', async () => {
    db.query
      .mockResolvedValueOnce([[]])  // pre-check passes
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' }); // UPDATE fails
    const res = mockRes();
    await updateProfile(mockReq({ body: { name: 'Alice', email: 'alice@new.com' } }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});


// ─────────────────────────────────────────────────────────
// updatePassword
// ─────────────────────────────────────────────────────────
describe('updatePassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – missing password fields', async () => {
    const res = mockRes();
    await updatePassword(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All password fields are required.' });
  });

  test('400 – new passwords do not match', async () => {
    const res = mockRes();
    await updatePassword(mockReq({ body: { currentPassword: 'Old1pass', newPassword: 'New1pass', confirmPassword: 'Other1pass' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Passwords do not match.' });
  });

  test('400 – weak new password', async () => {
    const res = mockRes();
    await updatePassword(mockReq({ body: { currentPassword: 'Old1pass', newPassword: 'weakpass', confirmPassword: 'weakpass' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('404 – user not found', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await updatePassword(mockReq({ body: { currentPassword: 'Old1pass', newPassword: 'Secure123', confirmPassword: 'Secure123' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('401 – current password incorrect', async () => {
    db.query.mockResolvedValue([[{ password: 'hashed' }]]);
    bcrypt.compareSync.mockReturnValueOnce(false); // current password check fails
    const res = mockRes();
    await updatePassword(mockReq({ body: { currentPassword: 'Wrong1pass', newPassword: 'Secure123', confirmPassword: 'Secure123' } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Current password is incorrect.' });
  });

  test('400 – new password same as current', async () => {
    db.query.mockResolvedValue([[{ password: 'hashed' }]]);
    bcrypt.compareSync
      .mockReturnValueOnce(true)  // current password matches
      .mockReturnValueOnce(true); // new password also matches current
    const res = mockRes();
    await updatePassword(mockReq({ body: { currentPassword: 'Same1pass', newPassword: 'Same1pass', confirmPassword: 'Same1pass' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'New password must be different from your current password.' });
  });

  test('200 – password updated successfully', async () => {
    db.query
      .mockResolvedValueOnce([[{ password: 'hashed' }]])
      .mockResolvedValueOnce([{}]);
    bcrypt.compareSync
      .mockReturnValueOnce(true)   // current password correct
      .mockReturnValueOnce(false); // new password is different
    bcrypt.hashSync.mockReturnValue('newHashed');
    const res = mockRes();
    await updatePassword(mockReq({ body: { currentPassword: 'Old1pass', newPassword: 'NewSecure1', confirmPassword: 'NewSecure1' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully.' });
  });
});