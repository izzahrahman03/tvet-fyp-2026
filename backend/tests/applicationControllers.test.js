// tests/applicationControllers.test.js

jest.mock('../database/db');
jest.mock('../emails/adminEmail', () => ({
  sendApplicationStatusEmail: jest.fn(),
}));

const db = require('../database/db');
const {
  submitApplication,
  getMyApplication,
  acceptOffer,
  adminListApplications,
  adminGetApplication,
  adminDeleteApplication,
  adminUpdateStatus,
} = require('../controllers/applicationControllers');

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

const validAppBody = {
  fullName: 'Alice Tan', icNumber: '990101-01-1234', dob: '1999-01-01',
  gender: 'Female', race: 'Chinese', maritalStatus: 'Single',
  email: 'alice@test.com', phone: '0123456789', fullAddress: '123 Main St',
  postalCode: '50000', state: 'Kuala Lumpur',
};

beforeEach(() => {
  jest.clearAllMocks();
  db.getConnection = jest.fn().mockResolvedValue(mockConn);
});


// ─────────────────────────────────────────────────────────
// submitApplication
// ─────────────────────────────────────────────────────────
describe('submitApplication', () => {
  test('400 – missing required fields', async () => {
    const res = mockRes();
    await submitApplication(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Missing required fields') }));
  });

  test('400 – partial missing fields lists them correctly', async () => {
    const res = mockRes();
    await submitApplication(mockReq({ body: { fullName: 'Alice' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    const callArg = res.json.mock.calls[0][0];
    expect(callArg.message).toMatch(/IC Number/);
  });

  test('201 – new application submitted', async () => {
    db.query
      .mockResolvedValueOnce([[]])               // SELECT – no existing application
      .mockResolvedValueOnce([{ insertId: 5 }]); // INSERT application
    // insertEducation and insertSkills are no-ops when body arrays are absent
    const res = mockRes();
    await submitApplication(mockReq({ body: validAppBody }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ application_id: 5 }));
  });

  test('200 – existing application updated', async () => {
    // The controller does: SELECT → UPDATE → DELETE edu → (insertEdu no-op) → DELETE skills → (insertSkills no-op)
    db.query
      .mockResolvedValueOnce([[{ application_id: 3 }]]) // SELECT – existing app
      .mockResolvedValueOnce([{}])                       // UPDATE applications
      .mockResolvedValueOnce([{}])                       // DELETE application_education
      .mockResolvedValueOnce([{}]);                      // DELETE application_skills
    const res = mockRes();
    await submitApplication(mockReq({ body: validAppBody }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Application updated', application_id: 3 }));
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = mockRes();
    await submitApplication(mockReq({ body: validAppBody }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// getMyApplication
// ─────────────────────────────────────────────────────────
describe('getMyApplication', () => {
  test('200 – returns null when no application', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await getMyApplication(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({ application: null });
  });

  test('200 – returns application with education and skills', async () => {
    const fakeApp = { application_id: 1, name: 'Alice', status: 'pending' };
    db.query
      .mockResolvedValueOnce([[fakeApp]])
      .mockResolvedValueOnce([[{ institute_name: 'UTM' }]])
      .mockResolvedValueOnce([[{ skill_name: 'JavaScript' }]]);
    const res = mockRes();
    await getMyApplication(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      application: expect.objectContaining({ education: expect.any(Array), skills: expect.any(Array) }),
    }));
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await getMyApplication(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// acceptOffer
// ─────────────────────────────────────────────────────────
describe('acceptOffer', () => {
  test('404 – no application found', async () => {
    mockConn.query.mockResolvedValueOnce([[]]); // no application
    const res = mockRes();
    await acceptOffer(mockReq(), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('400 – application not in approved state', async () => {
    mockConn.query.mockResolvedValueOnce([[{ application_id: 1, status: 'pending' }]]);
    const res = mockRes();
    await acceptOffer(mockReq(), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Your application is not in an approved state.' });
  });

  test('200 – offer accepted, student record created', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ application_id: 1, status: 'approved' }]])
      .mockResolvedValueOnce([{}])   // UPDATE applications → accepted
      .mockResolvedValueOnce([{}])   // UPDATE users role → student
      .mockResolvedValueOnce([[{ intake_id: 2, intake_name: 'Jan 2025', max_capacity: 30, current_count: 5 }]])
      .mockResolvedValueOnce([[{ total: 3 }]])   // matric count
      .mockResolvedValueOnce([{ insertId: 10 }]); // INSERT students
    const res = mockRes();
    await acceptOffer(mockReq(), res);
    expect(mockConn.commit).toHaveBeenCalled();
  });
});


// ─────────────────────────────────────────────────────────
// adminListApplications
// ─────────────────────────────────────────────────────────
describe('adminListApplications', () => {
  test('200 – returns all applications', async () => {
    db.query.mockResolvedValue([[{ id: 1, name: 'Alice', status: 'pending' }]]);
    const res = mockRes();
    await adminListApplications(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ applications: expect.any(Array) }));
  });

  test('200 – filters by status', async () => {
    db.query.mockResolvedValue([[{ id: 2, status: 'approved' }]]);
    const res = mockRes();
    await adminListApplications(mockReq({ query: { status: 'approved' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ applications: expect.any(Array) }));
  });

  test('200 – filters by search', async () => {
    db.query.mockResolvedValue([[{ id: 1, name: 'Alice' }]]);
    const res = mockRes();
    await adminListApplications(mockReq({ query: { search: 'Alice' } }), res);
    expect(res.json).toHaveBeenCalled();
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await adminListApplications(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// adminGetApplication
// ─────────────────────────────────────────────────────────
describe('adminGetApplication', () => {
  test('404 – application not found', async () => {
    db.query.mockResolvedValue([[]]); // no rows
    const res = mockRes();
    await adminGetApplication(mockReq({ params: { id: '999' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('200 – returns application with education and skills', async () => {
    db.query
      .mockResolvedValueOnce([[{ application_id: 1, name: 'Alice' }]])
      .mockResolvedValueOnce([[{ institute_name: 'UTM' }]])
      .mockResolvedValueOnce([[{ skill_name: 'React' }]]);
    const res = mockRes();
    await adminGetApplication(mockReq({ params: { id: '1' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      application: expect.objectContaining({ education: expect.any(Array) }),
    }));
  });
});


// ─────────────────────────────────────────────────────────
// adminDeleteApplication
// ─────────────────────────────────────────────────────────
describe('adminDeleteApplication', () => {
  test('404 – application not found', async () => {
    mockConn.query
      .mockResolvedValueOnce([{}])               // DELETE education
      .mockResolvedValueOnce([{}])               // DELETE skills
      .mockResolvedValueOnce([{}])               // DELETE interviews
      .mockResolvedValueOnce([{}])               // DELETE students
      .mockResolvedValueOnce([{ affectedRows: 0 }]); // DELETE application – not found
    const res = mockRes();
    await adminDeleteApplication(mockReq({ params: { id: '999' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('200 – application deleted with all related records', async () => {
    mockConn.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockRes();
    await adminDeleteApplication(mockReq({ params: { id: '1' } }), res);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Application deleted successfully.' });
  });
});


// ─────────────────────────────────────────────────────────
// adminUpdateStatus
// ─────────────────────────────────────────────────────────
describe('adminUpdateStatus', () => {
  test('400 – invalid status value', async () => {
    const res = mockRes();
    await adminUpdateStatus(mockReq({ params: { id: '1' }, body: { status: 'invalid_status' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('404 – application not found', async () => {
    mockConn.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = mockRes();
    await adminUpdateStatus(mockReq({ params: { id: '999' }, body: { status: 'under_review' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('400 – interview status missing required interview fields', async () => {
    mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockRes();
    await adminUpdateStatus(mockReq({ params: { id: '1' }, body: { status: 'interview' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('interview_datetime') }));
  });

  test('200 – status updated to under_review', async () => {
    mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    db.query.mockResolvedValueOnce([[{ id: 1, name: 'Alice', email: 'a@b.com', status: 'under_review' }]]);
    const res = mockRes();
    await adminUpdateStatus(mockReq({ params: { id: '1' }, body: { status: 'under_review' } }), res);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('under_review') }));
  });

  test('200 – status updated to interview with details saved', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{}]);
    db.query.mockResolvedValueOnce([[{ id: 1, name: 'Alice', email: 'a@b.com', status: 'interview' }]]);
    const res = mockRes();
    await adminUpdateStatus(mockReq({
      params: { id: '1' },
      body: { status: 'interview', interview_datetime: '2025-03-01 10:00', venue: 'Room A', interviewer_name: 'Dr Lee' },
    }), res);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('interview') }));
  });

  test('200 – status updated to approved', async () => {
    mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    db.query.mockResolvedValueOnce([[{ id: 1, name: 'Alice', email: 'a@b.com', status: 'approved' }]]);
    const res = mockRes();
    await adminUpdateStatus(mockReq({ params: { id: '1' }, body: { status: 'approved' } }), res);
    expect(mockConn.commit).toHaveBeenCalled();
  });

  test('500 – DB error', async () => {
    mockConn.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await adminUpdateStatus(mockReq({ params: { id: '1' }, body: { status: 'approved' } }), res);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});