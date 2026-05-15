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
        i.application_start_date,
        i.application_end_date,
        i.intake_start_date,
        i.intake_end_date,
        i.max_capacity,
        COUNT(s.student_id) AS current_count,
        CASE
          WHEN CURDATE() BETWEEN i.intake_start_date AND i.intake_end_date THEN 'active'
          WHEN CURDATE() < i.intake_start_date                             THEN 'upcoming'
          ELSE                                                                  'ended'
        END AS intake_status
      FROM intakes i
      LEFT JOIN students s ON s.intake_id = i.intake_id
      GROUP BY i.intake_id
      ORDER BY i.intake_start_date DESC
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
    const {
      intake_name,
      application_start_date, application_end_date,
      intake_start_date, intake_end_date,
      max_capacity,
    } = req.body;

    if (!intake_name?.trim() || !intake_start_date || !intake_end_date || !max_capacity) {
      return res.status(400).json({ message: 'intake_name, intake_start_date, intake_end_date, and max_capacity are required.' });
    }

    if (new Date(intake_start_date) >= new Date(intake_end_date)) {
      return res.status(400).json({ message: 'Intake start date must be before intake end date.' });
    }

    if (parseInt(max_capacity) < 1) {
      return res.status(400).json({ message: 'max_capacity must be at least 1.' });
    }

    // ── Application window validation (optional fields) ────
    if (!application_start_date || !application_end_date) {
      return res.status(400).json({
        message: 'application_start_date and application_end_date are required.'
      });
    }

    const appStartDate = application_start_date;
    const appEndDate = application_end_date;


    if (appStartDate && appEndDate) {
      if (new Date(appStartDate) >= new Date(appEndDate)) {
        return res.status(400).json({ message: 'Application start date must be before application end date.' });
      }
      if (new Date(appStartDate) >= new Date(intake_start_date)) {
        return res.status(400).json({ message: 'Application start date must be earlier than the intake start date.' });
      }
      if (new Date(appEndDate) > new Date(intake_end_date)) {
        return res.status(400).json({ message: 'Application end date cannot be later than the intake end date.' });
      }
    }

    const [existing] = await db.query(
      'SELECT intake_id FROM intakes WHERE intake_name = ?',
      [intake_name.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An intake with this name already exists. Please use a different name.' });
    }

    const [result] = await db.query(
      `INSERT INTO intakes
         (intake_name, application_start_date, application_end_date,
          intake_start_date, intake_end_date, max_capacity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [intake_name.trim(), appStartDate, appEndDate, intake_start_date, intake_end_date, parseInt(max_capacity)]
    );

    const [rows] = await db.query(`
      SELECT
        i.intake_id, i.intake_name,
        i.application_start_date, i.application_end_date,
        i.intake_start_date, i.intake_end_date,
        i.max_capacity,
        0 AS current_count,
        CASE
          WHEN CURDATE() BETWEEN i.intake_start_date AND i.intake_end_date THEN 'active'
          WHEN CURDATE() < i.intake_start_date                             THEN 'upcoming'
          ELSE                                                                  'ended'
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
    const {
      intake_name,
      application_start_date, application_end_date,
      intake_start_date, intake_end_date,
      max_capacity,
    } = req.body;

    if (!intake_name?.trim() || !intake_start_date || !intake_end_date || !max_capacity) {
      return res.status(400).json({ message: 'intake_name, intake_start_date, intake_end_date, and max_capacity are required.' });
    }

    if (new Date(intake_start_date) >= new Date(intake_end_date)) {
      return res.status(400).json({ message: 'Intake start date must be before intake end date.' });
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

    // ── Application window validation (optional fields) ────
    const appStartDate = application_start_date || null;
    const appEndDate   = application_end_date   || null;

    if (appStartDate && !appEndDate) {
      return res.status(400).json({ message: 'Application end date is required when application start date is provided.' });
    }
    if (!appStartDate && appEndDate) {
      return res.status(400).json({ message: 'Application start date is required when application end date is provided.' });
    }
    if (appStartDate && appEndDate) {
      if (new Date(appStartDate) >= new Date(appEndDate)) {
        return res.status(400).json({ message: 'Application start date must be before application end date.' });
      }
      if (new Date(appStartDate) >= new Date(intake_start_date)) {
        return res.status(400).json({ message: 'Application start date must be earlier than the intake start date.' });
      }
      if (new Date(appEndDate) > new Date(intake_end_date)) {
        return res.status(400).json({ message: 'Application end date cannot be later than the intake end date.' });
      }
    }

    const [existing] = await db.query(
      'SELECT intake_id FROM intakes WHERE intake_name = ? AND intake_id != ?',
      [intake_name.trim(), id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An intake with this name already exists. Please use a different name.' });
    }

    const [result] = await db.query(
      `UPDATE intakes
       SET intake_name = ?,
           application_start_date = ?, application_end_date = ?,
           intake_start_date = ?, intake_end_date = ?,
           max_capacity = ?, updated_at = NOW()
       WHERE intake_id = ?`,
      [intake_name.trim(), appStartDate, appEndDate, intake_start_date, intake_end_date, parseInt(max_capacity), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Intake not found.' });
    }

    const [rows] = await db.query(`
      SELECT
        i.intake_id, i.intake_name,
        i.application_start_date, i.application_end_date,
        i.intake_start_date, i.intake_end_date,
        i.max_capacity,
        COUNT(s.student_id) AS current_count,
        CASE
          WHEN CURDATE() BETWEEN i.intake_start_date AND i.intake_end_date THEN 'active'
          WHEN CURDATE() < i.intake_start_date                             THEN 'upcoming'
          ELSE                                                                  'ended'
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

// ══════════════════════════════════════════════════════════
// GET /api/intake/window
// Returns whether applications are currently open, based on
// whether today falls within an active intake's application
// date range. Register this route as:
//   router.get('/intake/window', checkApplicationWindow);
// ══════════════════════════════════════════════════════════
exports.checkApplicationWindow = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.intake_id,
        i.intake_name,
        i.application_start_date,
        i.application_end_date
      FROM intakes i
      WHERE i.application_start_date IS NOT NULL
        AND i.application_end_date IS NOT NULL
        AND CURDATE() BETWEEN i.application_start_date AND i.application_end_date
        AND CURDATE() BETWEEN i.intake_start_date AND i.intake_end_date
      LIMIT 1
    `);
    const open = rows.length > 0;
    return res.json({ open, intake: open ? rows[0] : null });
  } catch (err) {
    console.error('checkApplicationWindow error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

