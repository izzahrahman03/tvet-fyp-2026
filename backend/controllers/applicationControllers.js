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
      fullName, icNumber, dob, gender,
      email, phone, fullAddress, postalCode, state,
      hearAboutUs, interviewSlotId,
      action = 'submit',
    } = req.body;

    const isDraft = action === 'draft';
    const status  = isDraft ? 'draft' : 'submitted';

    let education = [];
    try { education = JSON.parse(req.body.education || '[]'); } catch {}

    // ── Full validation on submit only ──────────────────────
    if (!isDraft) {
      const required = {
        fullName, icNumber, dob, gender,
        email, phone, fullAddress, postalCode, state, hearAboutUs,
      };
      const labels = {
        fullName: 'Full Name', icNumber: 'IC Number', dob: 'Date of Birth',
        gender: 'Gender',
        email: 'Email', phone: 'Phone', fullAddress: 'Full Address',
        postalCode: 'Postal Code', state: 'State',
        hearAboutUs: 'How Did You Hear About Us',
      };
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
           (SELECT COUNT(*) FROM applications WHERE interview_slot_id = s.slot_id AND application_status != 'draft') AS booked
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
      'SELECT application_id, application_status FROM applications WHERE user_id = ?',
      [userId]
    );

    let appId;

    if (existing.length > 0) {
      appId = existing[0].application_id;

      // Lock editing once admin has started processing (interview stage or beyond).
      // Draft saves (action='draft') are also blocked at this point — no point
      // saving a draft once the application is past 'submitted'.
      const currentStatus = existing[0].application_status;
      const editableStatuses = ['draft', 'submitted'];
      if (!editableStatuses.includes(currentStatus)) {
        return res.status(400).json({
          message: 'Your application can no longer be edited at this stage.',
        });
      }

      await db.query(
        `UPDATE applications SET
          ic_number=?, date_of_birth=?, gender=?,
          phone=?, full_address=?,
          postal_code=?, state=?,
          hear_about_us=?, interview_slot_id=?,
          application_status=?, updated_at=NOW()
        WHERE application_id=?`,
        [
          icNumber || null, dob || null, gender || null,
          phone || null, fullAddress || null,
          postalCode || null, state || null,
          hearAboutUs || null, slotIdValue,
          status, appId,
        ]
      );

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
         (user_id, ic_number, date_of_birth, gender,
          phone, full_address, postal_code, state,
          hear_about_us, interview_slot_id, application_status, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        [
          userId,
          icNumber || null, dob || null,
          gender || null,
          phone || null, fullAddress || null,
          postalCode || null, state || null,
          hearAboutUs || null, slotIdValue, status,
        ]
      );

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
      'SELECT application_id, application_status FROM applications WHERE user_id = ?',
      [userId]
    );

    if (apps.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'No application found.' });
    }

    if (apps[0].application_status !== 'passed') {
      await conn.rollback();
      return res.status(400).json({ message: 'Your application has not passed evaluation yet.' });
    }

    const appId = apps[0].application_id;

    await conn.query(
      'UPDATE applications SET applicant_response = ?, updated_at = NOW() WHERE application_id = ?',
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
       WHERE CURDATE() BETWEEN i.intake_start_date AND i.intake_end_date
       GROUP BY i.intake_id
       HAVING current_count < i.max_capacity
       ORDER BY i.intake_start_date DESC
       LIMIT 1`,
      []
    );

    const activeIntake = intakes.length > 0 ? intakes[0] : null;
    const intakeId     = activeIntake ? activeIntake.intake_id : null;

    // Replace lines 369–381 with this:

const year = new Date().getFullYear();

let matricNumber;
let inserted = false;
let attempts = 0;

while (!inserted && attempts < 5) {
  attempts++;

  // Derive the next sequence from the highest existing matric number this year
  const [maxRows] = await conn.query(
    `SELECT MAX(CAST(SUBSTRING_INDEX(matric_number, '-', -1) AS UNSIGNED)) AS max_seq
     FROM students
     WHERE matric_number LIKE ?`,
    [`STU-${year}-%`]
  );

  const nextSeq   = (maxRows[0].max_seq ?? 0) + 1;
  const sequence  = String(nextSeq).padStart(5, '0');
  matricNumber    = `STU-${year}-${sequence}`;

  try {
    await conn.query(
      `INSERT INTO students (user_id, application_id, intake_id, matric_number, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, appId, intakeId, matricNumber]
    );
    inserted = true;
  } catch (insertErr) {
    if (insertErr.code === 'ER_DUP_ENTRY' && attempts < 5) {
      // Another concurrent request grabbed this sequence — retry
      continue;
    }
    throw insertErr; // Re-throw non-duplicate or exhausted retries
  }
}

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

    // Re-issue JWT with updated role so the frontend can redirect without re-login
    const jwt      = require('jsonwebtoken');
    const newToken = jwt.sign(
      { id: userId, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message:       `Offer accepted! Your matric number is ${matricNumber}. ${intakeMsg}`,
      matric_number: matricNumber,
      token:         newToken,
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
      'SELECT application_id, application_status, applicant_response FROM applications WHERE user_id = ?',
      [userId]
    );

    if (apps.length === 0)
      return res.status(404).json({ message: 'No application found.' });

    const currentStatus    = apps[0].application_status;
    const declineableFrom = ['passed', 'submitted', 'attended'];

    if (!declineableFrom.includes(currentStatus))
      return res.status(400).json({ message: 'You cannot decline at this stage.' });

    await db.query(
      (currentStatus === 'passed'
        ? 'UPDATE applications SET applicant_response = ?, updated_at = NOW() WHERE application_id = ?'
        : 'UPDATE applications SET applicant_response = ?, updated_at = NOW() WHERE application_id = ?'),
      [currentStatus === 'passed' ? 'rejected' : 'withdrawn', apps[0].application_id]
    );

    const msg = currentStatus === 'passed'
      ? 'Offer declined successfully.'
      : 'Application withdrawn successfully.';

    // Send decline confirmation email
    // After (fixed) ✅
    const [appData] = await db.query(
      `SELECT u.email, u.name
      FROM applications a
      JOIN users u ON u.user_id = a.user_id
      WHERE a.application_id = ?`,
      [apps[0].application_id]
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
        a.application_status,
        a.applicant_response,
        a.hear_about_us,
        a.created_at, u.user_id,
        isl.slot_datetime AS preferred_slot_datetime,
        isl.capacity      AS preferred_slot_capacity,
        ROUND(AVG(ie.total_score), 1) AS total_score
      FROM applications a
      JOIN  users           u   ON u.user_id   = a.user_id
      LEFT JOIN interview_slots       isl ON isl.slot_id       = a.interview_slot_id
      LEFT JOIN interview_evaluations ie  ON ie.application_id = a.application_id
      WHERE a.application_status != 'draft'
    `;
    const params = [];
 
    if (status && status !== 'all') {
      sql += ' AND a.application_status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' GROUP BY a.application_id ORDER BY a.created_at DESC';
 
    const [rows] = await db.query(sql, params);
 
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

    // State-machine transitions — only valid moves are allowed
    const TRANSITIONS = {
      submitted: ['attended', 'absent'],
      attended:  ['passed',   'failed'],
    };

    // Fetch current status first
    const [appRows] = await conn.query(
      'SELECT application_status FROM applications WHERE application_id = ?', [id]
    );
    if (appRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }
    const currentStatus = appRows[0].application_status;

    // Block locked statuses
    if (['passed', 'failed', 'absent'].includes(currentStatus)) {
      await conn.rollback();
      return res.status(400).json({ message: `Application is already "${currentStatus}" and cannot be updated.` });
    }

    // Validate the requested transition
    const allowed = TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      await conn.rollback();
      return res.status(400).json({
        message: `Cannot change status from "${currentStatus}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}.`,
      });
    }

    const [result] = await conn.query(
      'UPDATE applications SET application_status = ?, remarks = COALESCE(?, remarks), updated_at = NOW() WHERE application_id = ?',
      [status, remarks || null, id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Application not found.' });
    }

    await conn.commit();

    // ── Fetch updated row for response + email ───────────────
    const [rows] = await db.query(
      `SELECT a.application_id AS id, u.name, u.email, a.phone, a.application_status AS status, a.created_at, u.user_id
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
// Returns future slots only (full slots included so the UI
// can grey them out rather than hide them entirely).
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
        AND a.application_status != 'draft'
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
// INTERVIEW SLOTS — ADMIN/MANAGER  GET /api/admin/interview-slots
// Returns ALL slots (past + future) with booked count and
// the list of assigned interviewers for each slot.
// ══════════════════════════════════════════════════════════
exports.listInterviewSlotsAdmin = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         s.slot_id AS id,
         s.slot_datetime AS datetime,
         s.capacity,
         COUNT(DISTINCT a.application_id) AS booked,
         s.created_at,
         (
           SELECT JSON_ARRAYAGG(JSON_OBJECT('id', u.user_id, 'name', u.name))
           FROM interview_slot_interviewers isi
           JOIN users u ON u.user_id = isi.user_id
           WHERE isi.slot_id = s.slot_id
         ) AS interviewers
       FROM interview_slots s
       LEFT JOIN applications a
         ON a.interview_slot_id = s.slot_id
        AND a.application_status != 'draft'
       GROUP BY s.slot_id
       ORDER BY s.slot_datetime ASC`
    );

    const slots = rows.map(r => {
    const interviewers = Array.isArray(r.interviewers)
      ? r.interviewers                          
      : typeof r.interviewers === 'string'
        ? JSON.parse(r.interviewers)            
        : [];                                 

    return {
      ...r,
      interviewers,
      interviewer_ids: interviewers.map(iv => iv.id),
    };
  });

    return res.json({ slots });

  } catch (err) {
    console.error('listInterviewSlotsAdmin:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// ══════════════════════════════════════════════════════════
// INTERVIEW SLOTS — ADMIN CREATE  POST /api/interview-slots
// ══════════════════════════════════════════════════════════
exports.createInterviewSlot = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { datetime, capacity, interviewer_ids = [] } = req.body;

    if (!datetime)
      return res.status(400).json({ message: 'datetime is required.' });

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1)
      return res.status(400).json({ message: 'capacity must be a positive number.' });

    if (new Date(datetime) <= new Date())
      return res.status(400).json({ message: 'Interview slot must be in the future.' });

    if (Array.isArray(interviewer_ids) && interviewer_ids.length > 0) {
      const [conflicts] = await conn.query(
        `SELECT isi.user_id, u.name
        FROM interview_slot_interviewers isi
        JOIN interview_slots isl ON isl.slot_id = isi.slot_id
        JOIN users u ON u.user_id = isi.user_id
        WHERE isl.slot_datetime = ?
          AND isi.user_id IN (?)`,
        [datetime, interviewer_ids]
      );
      if (conflicts.length > 0) {
        await conn.rollback();
        const names = conflicts.map(c => c.name).join(', ');
        return res.status(409).json({ message: `Scheduling conflict: ${names} already has a slot at this time.` });
      }
    }

    const [result] = await conn.query(
      'INSERT INTO interview_slots (slot_datetime, capacity) VALUES (?, ?)',
      [datetime, cap]
    );

    const slotId = result.insertId;

    // Insert interviewer assignments
    if (Array.isArray(interviewer_ids) && interviewer_ids.length > 0) {
      const values = interviewer_ids.map(uid => [slotId, uid]);
      await conn.query(
        'INSERT INTO interview_slot_interviewers (slot_id, user_id) VALUES ?',
        [values]
      );
    }

    await conn.commit();

    return res.status(201).json({
      message: 'Interview slot created.',
      slot: { id: slotId, datetime, capacity: cap, booked: 0, interviewer_ids, interviewers: [] },
    });

  } catch (err) {
    await conn.rollback();
    console.error('createInterviewSlot:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};


// // ══════════════════════════════════════════════════════════
// // INTERVIEW SLOTS — ADMIN DELETE  DELETE /api/admin/interview-slots/:id
// // ══════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════
// INTERVIEW SLOTS — ADMIN UPDATE  PUT /api/interview-slots/:id
// ══════════════════════════════════════════════════════════
exports.updateInterviewSlot = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const { datetime, capacity, interviewer_ids = [] } = req.body;

    if (!datetime)
      return res.status(400).json({ message: 'datetime is required.' });

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1)
      return res.status(400).json({ message: 'capacity must be a positive number.' });

    // Check slot exists
    const [slot] = await conn.query(
      'SELECT slot_id FROM interview_slots WHERE slot_id = ?', [id]
    );
    if (slot.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Interview slot not found.' });
    }

    if (Array.isArray(interviewer_ids) && interviewer_ids.length > 0) {
      const [conflicts] = await conn.query(
        `SELECT isi.user_id, u.name
        FROM interview_slot_interviewers isi
        JOIN interview_slots isl ON isl.slot_id = isi.slot_id
        JOIN users u ON u.user_id = isi.user_id
        WHERE isl.slot_datetime = ?
          AND isi.user_id IN (?)
          AND isl.slot_id != ?`,
        [datetime, interviewer_ids, id]
      );
      if (conflicts.length > 0) {
        await conn.rollback();
        const names = conflicts.map(c => c.name).join(', ');
        return res.status(409).json({ message: `Scheduling conflict: ${names} already has a slot at this time.` });
      }
    }

    // Update datetime and capacity
    await conn.query(
      'UPDATE interview_slots SET slot_datetime = ?, capacity = ? WHERE slot_id = ?',
      [datetime, cap, id]
    );

    // Replace interviewer assignments atomically
    await conn.query(
      'DELETE FROM interview_slot_interviewers WHERE slot_id = ?', [id]
    );
    if (Array.isArray(interviewer_ids) && interviewer_ids.length > 0) {
      const values = interviewer_ids.map(uid => [id, uid]);
      await conn.query(
        'INSERT INTO interview_slot_interviewers (slot_id, user_id) VALUES ?',
        [values]
      );
    }

    await conn.commit();

    return res.json({
      message: 'Interview slot updated.',
      slot: { id: Number(id), datetime, capacity: cap, interviewer_ids },
    });

  } catch (err) {
    await conn.rollback();
    console.error('updateInterviewSlot:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } finally {
    conn.release();
  }
};