// controllers/applicationController.js
// Handles applicant form submission + admin fetch
// Matches your existing: db callback style, user_id column
//
// Install: npm install multer
// Run migration SQL below before using.

const db     = require('../database/db');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Multer config (profile photo) ─────────────────────────
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
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only.'));
  },
});

exports.uploadMiddleware = upload.single('avatar');


// ══════════════════════════════════════════════════════════
// POST /api/application
// Applicant submits the full form (personal + education + skills + avatar)
// ══════════════════════════════════════════════════════════
exports.submitApplication = (req, res) => {
  const userId = req.user.id;

  const {
    fullName, icNumber, dob, gender, race, maritalStatus,
    email, phone, streetAddress, city, postalCode, state, country,
  } = req.body;

  // Parse JSON arrays sent as form fields
  let education = [], skills = [];
  try { education = JSON.parse(req.body.education || '[]'); } catch {}
  try { skills    = JSON.parse(req.body.skills    || '[]'); } catch {}

  // Validate required fields
  const required = { fullName, icNumber, dob, gender, race, maritalStatus, email, phone, streetAddress, city, postalCode, state, country };
  const missing  = Object.entries(required).filter(([, v]) => !v?.trim()).map(([k]) => k);
  if (missing.length > 0)
    return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}.` });

  const avatarUrl = req.file ? `/uploads/applications/${req.file.filename}` : null;

  // ── Check if applicant already has a submission ───────────
  db.query('SELECT application_id FROM applications WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      console.error('submitApplication check:', err);
      return res.status(500).json({ message: err.message });
    }

    if (rows.length > 0) {
      // UPDATE existing application
      const appId = rows[0].application_id;

      db.query(
        `UPDATE applications SET
           full_name=?, ic_number=?, date_of_birth=?, gender=?, race=?,
           marital_status=?, email=?, phone=?, street_address=?, city=?,
           postal_code=?, state=?, country=?, avatar_url=COALESCE(?,avatar_url),
           status='pending', updated_at=NOW()
         WHERE application_id=?`,
        [fullName, icNumber, dob, gender, race, maritalStatus, email, phone,
         streetAddress, city, postalCode, state, country, avatarUrl, appId],
        (err) => {
          if (err) { console.error('update application:', err); return res.status(500).json({ message: err.message }); }

          // Replace education rows
          db.query('DELETE FROM application_education WHERE application_id = ?', [appId], (err) => {
            if (err) console.error('delete edu:', err);
            insertEducation(appId, education, () => {
              // Replace skill rows
              db.query('DELETE FROM application_skills WHERE application_id = ?', [appId], (err) => {
                if (err) console.error('delete skills:', err);
                insertSkills(appId, skills, () => {
                  res.json({ message: 'Application updated successfully.', application_id: appId });
                });
              });
            });
          });
        }
      );
    } else {
      // INSERT new application
      db.query(
        `INSERT INTO applications
           (user_id, full_name, ic_number, date_of_birth, gender, race, marital_status,
            email, phone, street_address, city, postal_code, state, country, avatar_url, status, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',NOW(),NOW())`,
        [userId, fullName, icNumber, dob, gender, race, maritalStatus,
         email, phone, streetAddress, city, postalCode, state, country, avatarUrl],
        (err, result) => {
          if (err) { console.error('insert application:', err); return res.status(500).json({ message: err.message }); }

          const appId = result.insertId;

          insertEducation(appId, education, () => {
            insertSkills(appId, skills, () => {
              res.status(201).json({ message: 'Application submitted successfully.', application_id: appId });
            });
          });
        }
      );
    }
  });
};


// ── Helpers: bulk insert education / skills ────────────────
function insertEducation(appId, rows, done) {
  if (!rows || rows.length === 0) return done();
  const values = rows
    .filter((r) => r.institute?.trim())
    .map((r) => [appId, r.institute, r.qualification, r.major, r.startDate || null, r.endDate || null]);
  if (values.length === 0) return done();
  db.query(
    'INSERT INTO application_education (application_id, institute_name, qualification, major, start_date, end_date) VALUES ?',
    [values],
    (err) => { if (err) console.error('insertEducation:', err); done(); }
  );
}

function insertSkills(appId, rows, done) {
  if (!rows || rows.length === 0) return done();
  const values = rows
    .filter((r) => r.skillName?.trim())
    .map((r) => [appId, r.skillName, r.proficiency]);
  if (values.length === 0) return done();
  db.query(
    'INSERT INTO application_skills (application_id, skill_name, proficiency) VALUES ?',
    [values],
    (err) => { if (err) console.error('insertSkills:', err); done(); }
  );
}


// ══════════════════════════════════════════════════════════
// GET /api/application/mine
// Applicant views their own submitted application
// ══════════════════════════════════════════════════════════
exports.getMyApplication = (req, res) => {
  const userId = req.user.id;

  db.query('SELECT * FROM applications WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (rows.length === 0) return res.json({ application: null });

    const app = rows[0];
    const appId = app.application_id;

    db.query('SELECT * FROM application_education WHERE application_id = ?', [appId], (err, edu) => {
      if (err) return res.status(500).json({ message: err.message });

      db.query('SELECT * FROM application_skills WHERE application_id = ?', [appId], (err, skills) => {
        if (err) return res.status(500).json({ message: err.message });

        res.json({ application: { ...app, education: edu, skills } });
      });
    });
  });
};


// ══════════════════════════════════════════════════════════
// GET /api/admin/applications          ← admin: list all
// GET /api/admin/applications/:id      ← admin: view one
// PUT /api/admin/applications/:id/status ← admin: approve/reject
// ══════════════════════════════════════════════════════════
exports.adminListApplications = (req, res) => {
  const { status, search } = req.query;
  let sql    = `SELECT a.application_id, a.full_name, a.email, a.phone,
                       a.status, a.created_at, u.user_id
                FROM   applications a
                JOIN   users u ON u.user_id = a.user_id
                WHERE  1=1`;
  const params = [];

  if (status && status !== 'all') { sql += ' AND a.status = ?'; params.push(status); }
  if (search) {
    sql += ' AND (a.full_name LIKE ? OR a.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY a.created_at DESC';

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ applications: rows });
  });
};

exports.adminGetApplication = (req, res) => {
  const { id } = req.params;

  db.query('SELECT * FROM applications WHERE application_id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (rows.length === 0) return res.status(404).json({ message: 'Application not found.' });

    const app = rows[0];

    db.query('SELECT * FROM application_education WHERE application_id = ?', [id], (err, edu) => {
      if (err) return res.status(500).json({ message: err.message });

      db.query('SELECT * FROM application_skills WHERE application_id = ?', [id], (err, skills) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ application: { ...app, education: edu, skills } });
      });
    });
  });
};

exports.adminUpdateStatus = (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const VALID = ['pending', 'approved', 'rejected', 'under_review'];
  if (!VALID.includes(status))
    return res.status(400).json({ message: `status must be one of: ${VALID.join(', ')}.` });

  db.query(
    'UPDATE applications SET status = ?, remarks = ?, updated_at = NOW() WHERE application_id = ?',
    [status, remarks || null, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Application not found.' });
      res.json({ message: `Application ${status}.` });
    }
  );
};