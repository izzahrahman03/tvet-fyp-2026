// tests/intakeControllers.test.js

jest.mock('../database/db');

const db = require('../database/db');
const { listIntakes, createIntake, updateIntake, deleteIntake } = require('../controllers/intakeControllers');

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const validIntakeBody = {
  intake_name: 'Intake 2025',
  start_date: '2025-01-01',
  end_date: '2025-06-30',
  max_capacity: 30,
};


// ─────────────────────────────────────────────────────────
// listIntakes
// ─────────────────────────────────────────────────────────
describe('listIntakes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 – returns list of intakes', async () => {
    const fakeIntakes = [{ intake_id: 1, intake_name: 'Intake A', current_count: 5 }];
    db.query.mockResolvedValue([fakeIntakes]);
    const res = mockRes();
    await listIntakes(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({ intakes: fakeIntakes });
  });

  test('200 – returns empty array when no intakes', async () => {
    db.query.mockResolvedValue([[]]);
    const res = mockRes();
    await listIntakes(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({ intakes: [] });
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await listIntakes(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// createIntake
// ─────────────────────────────────────────────────────────
describe('createIntake', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – missing required fields (all empty)', async () => {
    const res = mockRes();
    await createIntake(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 – blank intake_name', async () => {
    const res = mockRes();
    await createIntake(mockReq({ body: { ...validIntakeBody, intake_name: '   ' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 – start_date not before end_date', async () => {
    const res = mockRes();
    await createIntake(mockReq({ body: { ...validIntakeBody, start_date: '2025-06-30', end_date: '2025-01-01' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'start_date must be before end_date.' });
  });

  test('400 – same start_date and end_date', async () => {
    const res = mockRes();
    await createIntake(mockReq({ body: { ...validIntakeBody, start_date: '2025-01-01', end_date: '2025-01-01' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // NOTE: max_capacity: 0 is falsy, so the controller catches it in the
  // "required fields missing" guard (before the "< 1" check).
  // Both guards return 400, so we just assert the status code.
  test('400 – max_capacity of 0 is rejected', async () => {
    const res = mockRes();
    await createIntake(mockReq({ body: { ...validIntakeBody, max_capacity: 0 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // To hit the "< 1" branch specifically, we need a negative number
  // (negative is truthy, so it passes the required-fields check).
  test('400 – max_capacity less than 1 (negative value)', async () => {
    const res = mockRes();
    await createIntake(mockReq({ body: { ...validIntakeBody, max_capacity: -5 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'max_capacity must be at least 1.' });
  });

  test('201 – intake created successfully', async () => {
    const fakeIntake = { intake_id: 1, ...validIntakeBody, current_count: 0, intake_status: 'upcoming' };
    db.query
      .mockResolvedValueOnce([{ insertId: 1 }])  // INSERT
      .mockResolvedValueOnce([[fakeIntake]]);     // SELECT
    const res = mockRes();
    await createIntake(mockReq({ body: validIntakeBody }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ intake: fakeIntake }));
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await createIntake(mockReq({ body: validIntakeBody }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─────────────────────────────────────────────────────────
// updateIntake
// ─────────────────────────────────────────────────────────
describe('updateIntake', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – missing required fields', async () => {
    const res = mockRes();
    await updateIntake(mockReq({ params: { id: '1' }, body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 – start_date not before end_date', async () => {
    const res = mockRes();
    await updateIntake(mockReq({ params: { id: '1' }, body: { ...validIntakeBody, start_date: '2025-12-01', end_date: '2025-01-01' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 – capacity below current enrolment', async () => {
    db.query.mockResolvedValueOnce([[{ total: 20 }]]); // 20 students enrolled
    const res = mockRes();
    await updateIntake(mockReq({ params: { id: '1' }, body: { ...validIntakeBody, max_capacity: 10 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Cannot set capacity below') }));
  });

  test('404 – intake not found', async () => {
    db.query
      .mockResolvedValueOnce([[{ total: 0 }]])      // enrolment count
      .mockResolvedValueOnce([{ affectedRows: 0 }]); // UPDATE
    const res = mockRes();
    await updateIntake(mockReq({ params: { id: '999' }, body: validIntakeBody }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('200 – intake updated successfully', async () => {
    const fakeIntake = { intake_id: 1, ...validIntakeBody, current_count: 5, intake_status: 'active' };
    db.query
      .mockResolvedValueOnce([[{ total: 5 }]])       // enrolment count
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([[fakeIntake]]);          // SELECT
    const res = mockRes();
    await updateIntake(mockReq({ params: { id: '1' }, body: validIntakeBody }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ intake: fakeIntake }));
  });
});


// ─────────────────────────────────────────────────────────
// deleteIntake
// ─────────────────────────────────────────────────────────
describe('deleteIntake', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 – cannot delete when students are enrolled', async () => {
    db.query.mockResolvedValueOnce([[{ total: 3 }]]); // 3 students enrolled
    const res = mockRes();
    await deleteIntake(mockReq({ params: { id: '1' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Cannot delete') }));
  });

  test('404 – intake not found', async () => {
    db.query
      .mockResolvedValueOnce([[{ total: 0 }]])       // no students
      .mockResolvedValueOnce([{ affectedRows: 0 }]); // DELETE – not found
    const res = mockRes();
    await deleteIntake(mockReq({ params: { id: '999' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('200 – intake deleted successfully', async () => {
    db.query
      .mockResolvedValueOnce([[{ total: 0 }]])       // no students
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE succeeds
    const res = mockRes();
    await deleteIntake(mockReq({ params: { id: '1' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Intake deleted successfully.' });
  });

  test('500 – DB error', async () => {
    db.query.mockRejectedValue(new Error('DB error'));
    const res = mockRes();
    await deleteIntake(mockReq({ params: { id: '1' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});