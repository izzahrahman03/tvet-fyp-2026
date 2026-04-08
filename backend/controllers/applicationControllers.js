const db     = require('../database/db');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const { sendApplicationStatusEmail } = require('../emails/adminEmail');

// ─── Multer config ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/applications');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `app_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Images only.'));
  },
});

exports.uploadMiddleware = upload.single('avatar');


// ── Helpers ───────────────────────────────────────────────
async function insertEducation(appId, rows) {
  if (!rows?.length) return;
  const values = rows
    .filter(r => r.institute?.trim())
    .map(r => [appId, r.institute, r.qualification, r.startDate || null, r.endDate || null]);
  if (!values.length) return;
  await db.query(
    'INSERT INTO application_education (application_id, institute_name, qualification, start_date, end_date) VALUES ?',
    [values]
  );
}


// ══════════════════════════════════════════════════════════
// SUBMIT / SAVE DRAFT APPLICATION
// POST /api/application-form
//
// action = 'draft'  → save progress, status = 'draft' (no validation)
// action = 'submit' → full validation, status = 'submitted'
// ══════════════════════════════════════════════════════════
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      fullName, dob, gender,
      email, phone, fullAddress, postalCode, state,
      hearAboutUs, interviewSlotId,
      action = 'submit',
    } = req.body;

    //     const {
    //   fullName, icNumber, dob, gender, race, maritalStatus,
    //   email, phone, fullAddress, postalCode, state,
    //   hearAboutUs, interviewSlotId,
    //   action = 'submit',
    // } = req.body;

    const isDraft = action === 'draft';
    const status  = isDraft ? 'draft' : 'submitted';

    let education = [];
    try { education = JSON.parse(req.body.education || '[]'); } catch {}

    // ── Full validation on submit only ──────────────────────
    if (!isDraft) {
      const required = {
        fullName, dob, gender,
        email, phone, fullAddress, postalCode, state, hearAboutUs,
      };
      // const required = {
      //   fullName, icNumber, dob, gender, race, maritalStatus,
      //   email, phone, fullAddress, postalCode, state, hearAboutUs,
      // };
      const labels = {
        fullName: 'Full Name', dob: 'Date of Birth', gender: 'Gender',
        email: 'Email', phone: 'Phone', fullAddress: 'Full Address',
        postalCode: 'Postal Code', state: 'State',
        hearAboutUs: 'How Did You Hear About Us',
      };
      // const labels = {
      //   fullName: 'Full Name', icNumber: 'IC Number', dob: 'Date of Birth',
      //   gender: 'Gender', race: 'Race', maritalStatus: 'Marital Status',
      //   email: 'Email', phone: 'Phone', fullAddress: 'Full Address',
      //   postalCode: 'Postal Code', state: 'State',
      //   hearAboutUs: 'How Did You Hear About Us',
      // };
      const missing = Object.entries(required).filter(([, v]) => !v?.trim()).map(([k]) => k);
      if (missing.length > 0) {
        const friendly = missing.map(k => labels[k] || k);
        return res.status(400).json({ message: `Missing required fields: ${friendly.join(', ')}` });
      }

      if (!interviewSlotId) {
        return res.status(400).json({ message: 'Please select an interview slot.' });
      }

      // Verify slot still has capacity
      const [slotRows] = await db.query(
        `SELECT slot_id, capacity,
           (SELECT COUNT(*) FROM applications WHERE interview_slot_id = s.slot_id AND status != 'draft') AS booked
         FROM interview_slots s
         WHERE slot_id = ?`,
        [interviewSlotId]
      );
      if (slotRows.length === 0) {
        return res.status(400).json({ message: 'Selected interview slot no longer exists.' });
      }
      if (slotRows[0].booked >= slotRows[0].capacity) {
        return res.status(400).json({ message: 'Sorry, that interview slot is now full. Please choose another.' });
      }
    }

    const slotIdValue = interviewSlotId ? parseInt(interviewSlotId, 10) : null;

    // ── Check for existing application ──────────────────────
    const [existing] = await db.query(
      'SELECT application_id, status FROM applications WHERE user_id = ?',
      [userId]
    );

    let appId;

    if (existing.length > 0) {
      appId = existing[0].application_id;

      // Lock editing once admin has started processing (interview stage or beyond).
      // Draft saves (action='draft') are also blocked at this point — no point
      // saving a draft once the application is past 'submitted'.
      const currentStatus = existing[0].status;
      const editableStatuses = ['draft', 'submitted'];
      if (!editableStatuses.includes(currentStatus)) {
        return res.status(400).json({
          message: 'Your application can no longer be edited at this stage.',
        });
      }

      await db.query(
        `UPDATE applications SET
          date_of_birth=?, gender=?,
          phone=?, full_address=?,
          postal_code=?, state=?,
          hear_about_us=?, interview_slot_id=?,
          status=?, updated_at=NOW()
        WHERE application_id=?`,
        [
          dob || null, gender || null,
          phone || null, fullAddress || null,
          postalCode || null, state || null,
          hearAboutUs || null, slotIdValue,
          status, appId,
        ]
      );

      // await db.query(
      //   `UPDATE applications SET
      //     ic_number=?, date_of_birth=?, gender=?, race=?,
      //     marital_status=?, phone=?, full_address=?,
      //     postal_code=?, state=?,
      //     hear_about_us=?, interview_slot_id=?,
      //     status=?, updated_at=NOW()
      //   WHERE application_id=?`,
      //   [
      //     icNumber || null, dob || null,
      //     gender || null, race || null, maritalStatus || null,
      //     phone || null, fullAddress || null,
      //     postalCode || null, state || null,
      //     hearAboutUs || null, slotIdValue,
      //     status, appId,
      //   ]
      // );

      await db.query('DELETE FROM application_education WHERE application_id=?', [appId]);
      await insertEducation(appId, education);

      if (!isDraft) {
        // Fetch slot datetime for confirmation email
        let slotDatetime = null;
        if (slotIdValue) {
          const [slotInfo] = await db.query(
            'SELECT slot_datetime FROM interview_slots WHERE slot_id = ?', [slotIdValue]
          );
          slotDatetime = slotInfo[0]?.slot_datetime || null;
        }
        sendApplicationStatusEmail(email, fullName, 'submitted', { slotDatetime });
      }

      return res.json({
        message: isDraft ? 'Draft saved.' : 'Application submitted.',
        application_id: appId,
        status,
      });

    } else {
      // ── New application ──────────────────────────────────
      const [result] = await db.query(
        `INSERT INTO applications
         (user_id, date_of_birth, gender,
          phone, full_address, postal_code, state,
          hear_about_us, interview_slot_id, status, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        [
          userId,
          dob || null,
          gender || null,
          phone || null, fullAddress || null,
          postalCode || null, state || null,
          hearAboutUs || null, slotIdValue, status,
        ]
      );

      // const [result] = await db.query(
      //   `INSERT INTO applications
      //    (user_id, ic_number, date_of_birth, gender, race, marital_status,
      //     phone, full_address, postal_code, state,
      //     hear_about_us, interview_slot_id, status, created_at, updated_at)
      //    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      //   [
      //     userId,
      //     icNumber || null, dob || null,
      //     gender || null, race || null, maritalStatus || null,
      //     phone || null, fullAddress || null,
      //     postalCode || null, state || null,
      //     hearAboutUs || null, slotIdValue, status,
      //   ]
      // );

      appId = result.insertId;
      await insertEducation(appId, education);

      if (!isDraft) {
        const [userData] = await db.query(
          'SELECT name, email FROM users WHERE user_id = ?', [userId]
        );
        const { name, email } = userData[0] || {};
        // Fetch slot datetime for confirmation email
        let slotDatetime = null;
        if (slotIdValue) {
          const [slotInfo] = await db.query(
            'SELECT slot_datetime FROM interview_slots WHERE slot_id = ?', [slotIdValue]
          );
          slotDatetime = slotInfo[0]?.slot_datetime || null;
        }
        sendApplicationStatusEmail(email, name, 'submitted', { slotDatetime });
      }

      return res.status(201).json({
        message: isDraft ? 'Draft saved.' : 'Application submitted.',
        application_id: appId,
        status,
      });
    }

  } catch (err) {
    console.error('submitApplication:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// GET MY APPLICATION   GET /api/my-application
// ══════════════════════════════════════════════════════════
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT
         a.*,
         u.name,
         u.email,
         isl.slot_datetime AS selected_slot_datetime,
         isl.capacity      AS selected_slot_capacity
       FROM applications a
       JOIN users u ON u.user_id = a.user_id
       LEFT JOIN interview_slots isl  ON isl.slot_id = a.interview_slot_id
       WHERE a.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) return res.json({ application: null });

    const app   = rows[0];
    const appId = app.application_id;

    const [education] = await db.query(
      'SELECT * FROM application_education WHERE application_id = ?', [appId]
    );

    return res.json({ application: { ...app, education } });

  } catch (err) {
    console.error('getMyApplication:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ACCEPT OFFER   POST /api/my-application/accept
// ══════════════════════════════════════════════════════════
exports.acceptOffer = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user.id;

    const [apps] = await conn.query(
      'SELECT application_id, status FROM applications WHERE user_id = ?',
      [userId]
    );

    if (apps.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'No application found.' });
    }

    if (apps[0].status !== 'passed') {
      await conn.rollback();
      return res.status(400).json({ message: 'Your application has not passed evaluation yet.' });
    }

    const appId = apps[0].application_id;

    await conn.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
      ['accepted', appId]
    );

    await conn.query(
      "UPDATE users SET role = 'student', active_status = 'active' WHERE user_id = ?",
      [userId]
    );

    // Find active intake with available capacity
    const [intakes] = await conn.query(
      `SELECT
         i.intake_id, i.intake_name, i.max_capacity,
         COUNT(s.student_id) AS current_count
       FROM intakes i
       LEFT JOIN students s ON s.intake_id = i.intake_id
       WHERE CURDATE() BETWEEN i.start_date AND i.end_date
       GROUP BY i.intake_id
       HAVING current_count < i.max_capacity
       ORDER BY i.start_date DESC
       LIMIT 1`,
      []
    );

    const activeIntake = intakes.length > 0 ? intakes[0] : null;
    const intakeId     = activeIntake ? activeIntake.intake_id : null;

    const year = new Date().getFullYear();
    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total FROM students WHERE YEAR(created_at) = ?`,
      [year]
    );
    const sequence     = String(countRows[0].total + 1).padStart(5, '0');
    const matricNumber = `STU-${year}-${sequence}`;

    await conn.query(
      `INSERT INTO students (user_id, application_id, intake_id, matric_number, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, appId, intakeId, matricNumber]
    );

    await conn.commit();

    const intakeMsg = activeIntake
      ? `You have been assigned to ${activeIntake.intake_name}.`
      : 'No active intake found — an admin will assign your intake shortly.';

    // Send enrolment confirmation email
    const [appData] = await db.query(
      `SELECT u.email, u.name
      FROM applications a
      JOIN users u ON u.user_id = a.user_id
      WHERE a.application_id = ?`,
      [appId]
    );
    if (appData.length > 0) {
      sendApplicationStatusEmail(
        appData[0].email,
        appData[0].name,
        'accepted',
        { matricNumber, intakeName: activeIntake?.intake_name || null }
      );
    }

    return res.json({
      message: `Offer accepted! Your matric number is ${matricNumber}. ${intakeMsg} Please log in again to access the student portal.`,
      matric_number: matricNumber,
    });

  } catch (err) {
    await conn.rollback();
    console.error('acceptOffer:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// DECLINE OFFER   POST /api/my-application/decline
// ══════════════════════════════════════════════════════════
exports.declineOffer = async (req, res) => {
  try {
    const userId = req.user.id;

    const [apps] = await db.query(
      'SELECT application_id, status FROM applications WHERE user_id = ?',
      [userId]
    );

    if (apps.length === 0)
      return res.status(404).json({ message: 'No application found.' });

    const currentStatus    = apps[0].status;
    const declineableFrom = ['passed', 'submitted', 'attended'];

    if (!declineableFrom.includes(currentStatus))
      return res.status(400).json({ message: 'You cannot decline at this stage.' });

    await db.query(
      'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
      ['declined', apps[0].application_id]
    );

    const msg = currentStatus === 'passed'
      ? 'Offer declined successfully.'
      : 'Application declined successfully.';

    // Send decline confirmation email
    const [appData] = await db.query(
      'SELECT email, name FROM applications WHERE application_id = ?', [apps[0].application_id]
    );
    if (appData.length > 0) {
      sendApplicationStatusEmail(appData[0].email, appData[0].name, 'declined', null);
    }

    return res.json({ message: msg });

  } catch (err) {
    console.error('declineOffer:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN LIST APPLICATIONS   GET /api/admin/applications
// ══════════════════════════════════════════════════════════
exports.listApplications = async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT
        a.application_id AS id,
        u.name, u.email, 
        a.phone,
        a.status, a.hear_about_us,
        a.created_at, u.user_id,
        isl.slot_datetime AS preferred_slot_datetime,
        isl.capacity      AS preferred_slot_capacity
      FROM applications a
      JOIN  users           u   ON u.user_id   = a.user_id
      LEFT JOIN interview_slots isl ON isl.slot_id = a.interview_slot_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (a.name LIKE ? OR a.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY a.created_at DESC';

    const [rows] = await db.query(sql, params);

    // Format the preferred slot label for convenience
    const fmt = (d) => d
      ? new Date(d).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })
      : null;

    const applications = rows.map(r => ({
      ...r,
      preferred_slot_label: r.preferred_slot_datetime ? fmt(r.preferred_slot_datetime) : null,
    }));

    return res.json({ applications });

  } catch (err) {
    console.error('listApplications:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN VIEW ONE APPLICATION   GET /api/admin/applications/:id
// ══════════════════════════════════════════════════════════
exports.getApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
         a.application_id AS id, a.*,
         u.name, u.email,
         isl.slot_datetime        AS selected_slot_datetime,
         isl.capacity             AS selected_slot_capacity
       FROM applications a
       JOIN users u ON u.user_id = a.user_id
       LEFT JOIN interview_slots        isl ON isl.slot_id       = a.interview_slot_id
       WHERE a.application_id = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Application not found.' });

    const app = rows[0];
    const [education] = await db.query(
      'SELECT * FROM application_education WHERE application_id = ?', [id]
    );

    return res.json({ application: { ...app, education } });

  } catch (err) {
    console.error('getApplication:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN DELETE APPLICATION   DELETE /api/admin/applications/:id
// ══════════════════════════════════════════════════════════
exports.deleteApplication = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;

    await conn.query('DELETE FROM application_education  WHERE application_id = ?', [id]);
    await conn.query('DELETE FROM students               WHERE application_id = ?', [id]);

    const [result] = await conn.query(
      'DELETE FROM applications WHERE application_id = ?', [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }

    await conn.commit();
    return res.json({ message: 'Application deleted successfully.' });

  } catch (err) {
    await conn.rollback();
    console.error('deleteApplication:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// ADMIN UPDATE STATUS   PATCH /api/admin/applications/:id/status
// ══════════════════════════════════════════════════════════
exports.updateApplicationStatus = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const { status, remarks } = req.body;

    // Admin-settable statuses only — applicant sets draft/submitted/accepted/declined
    const VALID = ['attended', 'absent', 'passed', 'failed', 'declined'];

    if (!VALID.includes(status)) {
      await conn.rollback();
      return res.status(400).json({ message: `Status must be one of: ${VALID.join(', ')}` });
    }

    const [result] = await conn.query(
      'UPDATE applications SET status = ?, remarks = COALESCE(?, remarks), updated_at = NOW() WHERE application_id = ?',
      [status, remarks || null, id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }

    await conn.commit();

    // ── Fetch updated row for response + email ───────────────
    const [rows] = await db.query(
      `SELECT a.application_id AS id, u.name, u.email, a.phone, a.status, a.created_at, u.user_id
       FROM applications a
       JOIN users u ON u.user_id = a.user_id
       WHERE a.application_id = ?`,
      [id]
    );

    const application = rows[0] || null;

    if (application) {
      sendApplicationStatusEmail(
        application.email,
        application.name,
        status,
        null
      );
    }

    return res.json({
      message: `Application status updated to ${status}.`,
      application,
    });

  } catch (err) {
    await conn.rollback();
    console.error('updateApplicationStatus:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// ══════════════════════════════════════════════════════════
// INTERVIEW SLOTS — APPLICANT  GET /api/interview-slots
// Returns all future slots with booked count (full slots included
// so the UI can grey them out rather than hide them entirely).
// ══════════════════════════════════════════════════════════
exports.listInterviewSlots = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         s.slot_id AS id,
         s.slot_datetime AS datetime,
         s.capacity,
         COUNT(a.application_id) AS booked
       FROM interview_slots s
       LEFT JOIN applications a
         ON a.interview_slot_id = s.slot_id
        AND a.status NOT IN ('draft', 'declined')
       WHERE s.slot_datetime > NOW()
       GROUP BY s.slot_id
       ORDER BY s.slot_datetime ASC`
    );

    return res.json({ slots: rows });

  } catch (err) {
    console.error('listInterviewSlots:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// INTERVIEW SLOTS — ADMIN  GET /api/admin/interview-slots
// ══════════════════════════════════════════════════════════
exports.listInterviewSlots = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         s.slot_id AS id,
         s.slot_datetime AS datetime,
         s.capacity,
         COUNT(a.application_id) AS booked,
         s.created_at
       FROM interview_slots s
       LEFT JOIN applications a
         ON a.interview_slot_id = s.slot_id
        AND a.status NOT IN ('draft', 'declined')
       GROUP BY s.slot_id
       ORDER BY s.slot_datetime ASC`
    );

    return res.json({ slots: rows });

  } catch (err) {
    console.error('listInterviewSlots:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// INTERVIEW SLOTS — ADMIN CREATE  POST /api/admin/interview-slots
// ══════════════════════════════════════════════════════════
exports.createInterviewSlot = async (req, res) => {
  try {
    const { datetime, capacity } = req.body;

    if (!datetime)
      return res.status(400).json({ message: 'datetime is required.' });

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1)
      return res.status(400).json({ message: 'capacity must be a positive number.' });

    if (new Date(datetime) <= new Date())
      return res.status(400).json({ message: 'Interview slot must be in the future.' });

    const [result] = await db.query(
      'INSERT INTO interview_slots (slot_datetime, capacity) VALUES (?, ?)',
      [datetime, cap]
    );

    return res.status(201).json({
      message: 'Interview slot created.',
      slot: { id: result.insertId, datetime, capacity: cap, booked: 0 },
    });

  } catch (err) {
    console.error('createInterviewSlot:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// INTERVIEW SLOTS — ADMIN DELETE  DELETE /api/admin/interview-slots/:id
// ══════════════════════════════════════════════════════════
exports.deleteInterviewSlot = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;

    // Clear references in applications first
    await conn.query(
      'UPDATE applications SET interview_slot_id = NULL WHERE interview_slot_id = ?', [id]
    );

    const [result] = await conn.query(
      'DELETE FROM interview_slots WHERE slot_id = ?', [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Interview slot not found.' });
    }

    await conn.commit();
    return res.json({ message: 'Interview slot deleted.' });

  } catch (err) {
    await conn.rollback();
    console.error('deleteInterviewSlot:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};