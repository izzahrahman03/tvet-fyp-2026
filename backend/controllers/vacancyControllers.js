// controllers/vacancyControllers.js
// Accessed by industry_partner role only.
// partner_id is always derived from req.user (JWT) — never trusted from the request body.

const db = require('../database/db');

// ── Helper: resolve partner_id from logged-in user ───────
async function getPartnerIdFromUser(userId) {
  const [rows] = await db.query(
    'SELECT partner_id FROM industry_partners WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0)
    throw { status: 403, message: 'No industry partner profile found for this account.' };
  return rows[0].partner_id;
}

// ── Shared SELECT for returning a full vacancy row ────────
const VACANCY_SELECT = `
  SELECT
    v.vacancy_id,
    v.vacancy_id  AS id,
    v.partner_id,
    v.position_name,
    v.capacity,
    v.description,
    v.responsibilities,
    v.start_date,
    v.end_date,
    v.status,
    v.created_at,
    v.updated_at,
    COALESCE(ip.company_name, u.name) AS company_name
  FROM vacancies v
  JOIN industry_partners ip ON ip.partner_id = v.partner_id
  JOIN users             u  ON u.user_id      = ip.user_id
`;


// ══════════════════════════════════════════════════════════
// LIST   GET /api/partner/vacancies
// Returns only vacancies belonging to the logged-in partner.
// ══════════════════════════════════════════════════════════
exports.listVacancies = async (req, res) => {
  try {
    const partnerId   = await getPartnerIdFromUser(req.user.id);
    const { search, status } = req.query;

    let sql    = VACANCY_SELECT + ` WHERE v.partner_id = ?`;
    const params = [partnerId];

    if (status && status !== 'All') {
      sql += ` AND v.status = ?`;
      params.push(status.toLowerCase());
    }
    if (search) {
      sql += ` AND v.position_name LIKE ?`;
      params.push(`%${search}%`);
    }
    sql += ' ORDER BY v.created_at DESC';

    const [rows] = await db.query(sql, params);
    return res.json({ vacancies: rows });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('listVacancies error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// GET ONE   GET /api/partner/vacancies/:id
// ══════════════════════════════════════════════════════════
exports.getVacancy = async (req, res) => {
  try {
    const partnerId = await getPartnerIdFromUser(req.user.id);
    const { id }    = req.params;

    const [rows] = await db.query(
      VACANCY_SELECT + ` WHERE v.vacancy_id = ? AND v.partner_id = ?`,
      [id, partnerId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Vacancy not found.' });

    return res.json({ vacancy: rows[0] });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('getVacancy error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// CREATE   POST /api/partner/vacancies
// partner_id is always set from JWT — request body value is ignored.
// ══════════════════════════════════════════════════════════
exports.createVacancy = async (req, res) => {
  try {
    const partnerId = await getPartnerIdFromUser(req.user.id);

    const {
      position_name,
      capacity,
      description,
      responsibilities,
      start_date,
      end_date,
      status = 'open',
    } = req.body;

    if (!position_name?.trim())
      return res.status(400).json({ message: 'Position name is required.' });
    if (!capacity || isNaN(Number(capacity)) || Number(capacity) < 1)
      return res.status(400).json({ message: 'Capacity must be a positive number.' });
    if (!start_date)
      return res.status(400).json({ message: 'Start date is required.' });
    if (!end_date)
      return res.status(400).json({ message: 'End date is required.' });
    if (new Date(start_date) >= new Date(end_date))
      return res.status(400).json({ message: 'End date must be after start date.' });
    if (!['open', 'closed'].includes(status.toLowerCase()))
      return res.status(400).json({ message: 'Status must be open or closed.' });

    const [result] = await db.query(
      `INSERT INTO vacancies
         (partner_id, position_name, capacity, description, responsibilities, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        partnerId,
        position_name.trim(),
        Number(capacity),
        description      || null,
        responsibilities || null,
        start_date,
        end_date,
        status.toLowerCase(),
      ]
    );

    const [rows] = await db.query(
      VACANCY_SELECT + ` WHERE v.vacancy_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ message: 'Vacancy created successfully.', vacancy: rows[0] });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('createVacancy error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// UPDATE   PUT /api/partner/vacancies/:id
// Only updates if the vacancy belongs to this partner.
// partner_id is never updatable.
// ══════════════════════════════════════════════════════════
exports.updateVacancy = async (req, res) => {
  try {
    const partnerId = await getPartnerIdFromUser(req.user.id);
    const { id }    = req.params;

    // Ownership check + fetch current dates for cross-field validation
    const [existing] = await db.query(
      'SELECT start_date, end_date FROM vacancies WHERE vacancy_id = ? AND partner_id = ?',
      [id, partnerId]
    );
    if (existing.length === 0)
      return res.status(404).json({ message: 'Vacancy not found.' });

    const {
      position_name,
      capacity,
      description,
      responsibilities,
      start_date,
      end_date,
      status,
    } = req.body;

    if (position_name !== undefined && !position_name?.trim())
      return res.status(400).json({ message: 'Position name cannot be empty.' });
    if (capacity !== undefined && (isNaN(Number(capacity)) || Number(capacity) < 1))
      return res.status(400).json({ message: 'Capacity must be a positive number.' });
    if (status && !['open', 'closed'].includes(status.toLowerCase()))
      return res.status(400).json({ message: 'Status must be open or closed.' });

    // Fall back to existing DB values when only one date is being updated
    const effectiveStart = start_date || existing[0].start_date;
    const effectiveEnd   = end_date   || existing[0].end_date;
    if (new Date(effectiveStart) >= new Date(effectiveEnd))
      return res.status(400).json({ message: 'End date must be after start date.' });

    const fields = {};
    if (position_name    !== undefined) fields.position_name    = position_name.trim();
    if (capacity         !== undefined) fields.capacity         = Number(capacity);
    if (description      !== undefined) fields.description      = description      || null;
    if (responsibilities !== undefined) fields.responsibilities = responsibilities || null;
    if (start_date       !== undefined) fields.start_date       = start_date;
    if (end_date         !== undefined) fields.end_date         = end_date;
    if (status           !== undefined) fields.status           = status.toLowerCase();

    if (Object.keys(fields).length === 0)
      return res.status(400).json({ message: 'No valid fields to update.' });

    const setClause = Object.keys(fields).map((f) => `${f} = ?`).join(', ');
    await db.query(
      `UPDATE vacancies SET ${setClause} WHERE vacancy_id = ? AND partner_id = ?`,
      [...Object.values(fields), id, partnerId]
    );

    const [rows] = await db.query(
      VACANCY_SELECT + ` WHERE v.vacancy_id = ?`,
      [id]
    );

    return res.json({ message: 'Vacancy updated successfully.', vacancy: rows[0] });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('updateVacancy error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// DELETE   DELETE /api/partner/vacancies/:id
// Only deletes if the vacancy belongs to this partner.
// ══════════════════════════════════════════════════════════
exports.deleteVacancy = async (req, res) => {
  try {
    const partnerId = await getPartnerIdFromUser(req.user.id);
    const { id }    = req.params;

    const [result] = await db.query(
      'DELETE FROM vacancies WHERE vacancy_id = ? AND partner_id = ?',
      [id, partnerId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Vacancy not found.' });

    return res.json({ message: 'Vacancy deleted successfully.' });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('deleteVacancy error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};