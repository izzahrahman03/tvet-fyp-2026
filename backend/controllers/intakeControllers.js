// controllers/intakeControllers.js
const db = require('../database/db');

// ══════════════════════════════════════════════════════════
// GET /api/admin/intakes
// ══════════════════════════════════════════════════════════
exports.listIntakes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.intake_id,
        i.intake_name,
        i.start_date,
        i.end_date,
        i.max_capacity,
        COUNT(s.student_id) AS current_count,
        CASE
          WHEN CURDATE() BETWEEN i.start_date AND i.end_date THEN 'active'
          WHEN CURDATE() < i.start_date                      THEN 'upcoming'
          ELSE                                                    'ended'
        END AS intake_status
      FROM intakes i
      LEFT JOIN students s ON s.intake_id = i.intake_id
      GROUP BY i.intake_id
      ORDER BY i.start_date DESC
    `);
    return res.json({ intakes: rows });
  } catch (err) {
    console.error('listIntakes error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/admin/intakes
// ══════════════════════════════════════════════════════════
exports.createIntake = async (req, res) => {
  try {
    const { intake_name, start_date, end_date, max_capacity } = req.body;

    if (!intake_name?.trim() || !start_date || !end_date || !max_capacity) {
      return res.status(400).json({ message: 'intake_name, start_date, end_date, and max_capacity are required.' });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: 'start_date must be before end_date.' });
    }

    if (parseInt(max_capacity) < 1) {
      return res.status(400).json({ message: 'max_capacity must be at least 1.' });
    }

    const [result] = await db.query(
      `INSERT INTO intakes (intake_name, start_date, end_date, max_capacity, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [intake_name.trim(), start_date, end_date, parseInt(max_capacity)]
    );

    const [rows] = await db.query(`
      SELECT
        i.intake_id, i.intake_name, i.start_date, i.end_date, i.max_capacity,
        0 AS current_count,
        CASE
          WHEN CURDATE() BETWEEN i.start_date AND i.end_date THEN 'active'
          WHEN CURDATE() < i.start_date                      THEN 'upcoming'
          ELSE                                                    'ended'
        END AS intake_status
      FROM intakes i
      WHERE i.intake_id = ?
    `, [result.insertId]);

    return res.status(201).json({ message: 'Intake created successfully.', intake: rows[0] });
  } catch (err) {
    console.error('createIntake error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ══════════════════════════════════════════════════════════
// PUT /api/admin/intakes/:id
// ══════════════════════════════════════════════════════════
exports.updateIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const { intake_name, start_date, end_date, max_capacity } = req.body;

    if (!intake_name?.trim() || !start_date || !end_date || !max_capacity) {
      return res.status(400).json({ message: 'intake_name, start_date, end_date, and max_capacity are required.' });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: 'start_date must be before end_date.' });
    }

    // Prevent shrinking capacity below current enrolment
    const [countRows] = await db.query(
      'SELECT COUNT(*) AS total FROM students WHERE intake_id = ?', [id]
    );
    if (parseInt(max_capacity) < countRows[0].total) {
      return res.status(400).json({
        message: `Cannot set capacity below current enrolment (${countRows[0].total} students).`,
      });
    }

    const [result] = await db.query(
      `UPDATE intakes SET intake_name = ?, start_date = ?, end_date = ?, max_capacity = ?, updated_at = NOW()
       WHERE intake_id = ?`,
      [intake_name.trim(), start_date, end_date, parseInt(max_capacity), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Intake not found.' });
    }

    const [rows] = await db.query(`
      SELECT
        i.intake_id, i.intake_name, i.start_date, i.end_date, i.max_capacity,
        COUNT(s.student_id) AS current_count,
        CASE
          WHEN CURDATE() BETWEEN i.start_date AND i.end_date THEN 'active'
          WHEN CURDATE() < i.start_date                      THEN 'upcoming'
          ELSE                                                    'ended'
        END AS intake_status
      FROM intakes i
      LEFT JOIN students s ON s.intake_id = i.intake_id
      WHERE i.intake_id = ?
      GROUP BY i.intake_id
    `, [id]);

    return res.json({ message: 'Intake updated successfully.', intake: rows[0] });
  } catch (err) {
    console.error('updateIntake error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ══════════════════════════════════════════════════════════
// DELETE /api/admin/intakes/:id
// ══════════════════════════════════════════════════════════
exports.deleteIntake = async (req, res) => {
  try {
    const { id } = req.params;

    // Block delete if students are enrolled
    const [countRows] = await db.query(
      'SELECT COUNT(*) AS total FROM students WHERE intake_id = ?', [id]
    );
    if (countRows[0].total > 0) {
      return res.status(400).json({
        message: `Cannot delete — ${countRows[0].total} student(s) are assigned to this intake.`,
      });
    }

    const [result] = await db.query('DELETE FROM intakes WHERE intake_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Intake not found.' });
    }

    return res.json({ message: 'Intake deleted successfully.' });
  } catch (err) {
    console.error('deleteIntake error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};