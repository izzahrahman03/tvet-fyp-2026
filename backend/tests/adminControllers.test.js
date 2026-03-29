// tests/adminControllers.test.js

jest.mock('../database/db');
jest.mock('bcryptjs');
// Do NOT mock 'crypto' — the controller uses crypto.randomBytes().toString('hex')
// and crypto.randomBytes().toString('base64').slice(). Mocking the whole module
// breaks chained calls. The real crypto module works fine in tests.
jest.mock('../emails/adminEmail', () => ({
  sendBulkActivationEmail: jest.fn(),
}));

const db     = require('../database/db');
const bcrypt = require('bcryptjs');
const { listUsers, updateUser, deleteUser, addUserByAdmin, listPartners, getStats } =
  require('../controllers/adminControllers');

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

const mockConn = {
  beginTransaction: jest.fn(),
  query:            jest.fn(),
  commit:           jest.fn(),
  rollback:         jest.fn(),
  release:          jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  db.getConnection = jest.fn().mockResolvedValue(mockConn);
  // bcrypt.hash is used (async) in addUserByAdmin
  bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');
});


// ─────────────────────────────────────────────────────────
// listUsers
// ─────────────────────────────────────────────────────────
describe('listUsers', () => {
  test('200 – returns applicants', async () => {
    db.query.mockResolvedValue([[{ id: 1, name: 'Alice', role: 'applicant' }]]);
    const res = mockRes();
    await listUsers(mockReq({ query: { role: 'applicant' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ users: expect.any(Array) }));
  });

  test('200 – returns students', async () => {
    db.query.mockResolvedValue([[{ id: 2, name: 'Bob', role: 'student' }]]);
    const res = mockRes();
    await listUsers(mockReq({ query: { role: 'student' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ users: expect.any(Array) }));
  });

  test('200 – returns industry partners', async () => {
    db.query.mockResolvedValue([[{ id: 3, company_name: 'ACME', role: 'industry_partner' }]]);
    const res = mockRes();
    await listUsers(mockReq({ query: { role: 'industry_partner' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ users: expect.any(Array) }));
  });

  test('200 – returns industry supervisors', async () => {
    db.query.mockResolvedValue([[{ id: 4, name: 'Carol', role: 'industry_supervisor' }]]);
    const res = mockRes();
    await listUsers(mockReq({ query: { role: 'industry_supervisor' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ users: expect.any(Array) }));
  });

  test('200 – fallback when no role filter', async () => {
    db.query.mockResolvedValue([[{ id: 1 }, { id: 2 }]]);
    const res = mockRes();
    await listUsers(mockReq({ query: {} }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ users: expect.any(Array) }));
  });

  test('200 – search filter applied for applicants', async () => {
    db.query.mockResolvedValue([[{ id: 1, name: 'Alice' }]]);
    const res = mockRes();
    await listUsers(mockReq({ query: { role: 'applicant', search: 'Alice' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ users: expect.any(Array) }));
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await listUsers(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// updateUser
// ─────────────────────────────────────────────────────────
describe('updateUser', () => {
  test('400 – no valid fields to update', async () => {
    const res = mockRes();
    await updateUser(mockReq({ params: { id: '1' }, body: { invalid_field: 'x' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('404 – user not found', async () => {
    mockConn.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = mockRes();
    await updateUser(mockReq({ params: { id: '999' }, body: { name: 'Ghost' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('200 – user updated successfully', async () => {
    mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    db.query.mockResolvedValueOnce([[{ id: 1, name: 'Alice Updated' }]]);
    const res = mockRes();
    await updateUser(mockReq({ params: { id: '1' }, body: { name: 'Alice Updated' } }), res);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.any(Object) }));
  });

  test('409 – duplicate email on update', async () => {
    mockConn.query.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    const res = mockRes();
    await updateUser(mockReq({ params: { id: '1' }, body: { email: 'taken@x.com' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('200 – updates phone for industry_partner', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE users
      .mockResolvedValueOnce([{}]);                  // UPDATE industry_partners phone
    db.query.mockResolvedValueOnce([[{ id: 1 }]]);
    const res = mockRes();
    await updateUser(mockReq({
      params: { id: '1' },
      query: { role: 'industry_partner' },
      body: { name: 'PartnerCo', phone: '0123456789' },
    }), res);
    expect(mockConn.commit).toHaveBeenCalled();
  });
});


// ─────────────────────────────────────────────────────────
// addUserByAdmin
// ─────────────────────────────────────────────────────────
describe('addUserByAdmin', () => {
  test('400 – missing name, email, or role', async () => {
    const res = mockRes();
    await addUserByAdmin(mockReq({ body: {} }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 – invalid role', async () => {
    const res = mockRes();
    await addUserByAdmin(mockReq({ body: { name: 'A', email: 'a@b.com', role: 'admin' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Role must be industry_partner or industry_supervisor.' });
  });

  test('409 – email already exists', async () => {
    mockConn.query.mockResolvedValueOnce([[{ user_id: 99 }]]); // email found
    const res = mockRes();
    await addUserByAdmin(mockReq({ body: { name: 'A', email: 'exists@b.com', role: 'industry_partner' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('200 – industry_partner created successfully', async () => {
    mockConn.query
      .mockResolvedValueOnce([[]])                 // SELECT – no existing user
      .mockResolvedValueOnce([{ insertId: 10 }])  // INSERT users
      .mockResolvedValueOnce([{}]);               // INSERT industry_partners
    const res = mockRes();
    await addUserByAdmin(mockReq({ body: { name: 'ACME', email: 'acme@b.com', role: 'industry_partner', phone: '012' } }), res);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('added successfully') }));
  });

  test('200 – industry_supervisor created successfully', async () => {
    mockConn.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 11 }])
      .mockResolvedValueOnce([{}]);
    const res = mockRes();
    await addUserByAdmin(mockReq({ body: { name: 'Sup', email: 'sup@b.com', role: 'industry_supervisor', company: 'Corp', position: 'Manager' } }), res);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('added successfully') }));
  });
});


// ─────────────────────────────────────────────────────────
// listPartners
// ─────────────────────────────────────────────────────────
describe('listPartners', () => {
  test('200 – returns partners list', async () => {
    const fakePartners = [{ partner_id: 1, company_name: 'ACME' }];
    db.query.mockResolvedValue([fakePartners]);
    const res = mockRes();
    await listPartners(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({ partners: fakePartners });
  });

  test('200 – search filter applied', async () => {
    db.query.mockResolvedValue([[{ partner_id: 1 }]]);
    const res = mockRes();
    await listPartners(mockReq({ query: { search: 'ACME' } }), res);
    expect(db.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await listPartners(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// getStats
// ─────────────────────────────────────────────────────────
describe('getStats', () => {
  test('200 – returns totals, applicantByStatus, monthly', async () => {
    db.query
      .mockResolvedValueOnce([[{ role: 'applicant', count: 10 }, { role: 'student', count: 5 }]])
      .mockResolvedValueOnce([[{ status: 'pending', count: 3 }]])
      .mockResolvedValueOnce([[{ month: 'Jan', month_num: 1, year: 2025, role: 'applicant', count: 2 }]]);
    const res = mockRes();
    await getStats(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      totals: expect.any(Object),
      applicantByStatus: expect.any(Object),
      monthly: expect.any(Array),
    }));
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getStats(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});