const db = require('../database/db');

// ── Helper ─────────────────────────────────────────────────
async function getInterviewerProfileId(userId) {
  const [rows] = await db.query(
    'SELECT interviewer_id FROM interviewers WHERE user_id = ?',
    [userId]
  );
  if (!rows.length)
    throw { status: 403, message: 'No interviewer profile found for this account.' };
  return rows[0].interviewer_id;
}

// ══════════════════════════════════════════════════════════
// GET /api/interviewer/applications
// ══════════════════════════════════════════════════════════
exports.getMyApplications = async (req, res) => {
  try {
    const userId      = req.user.id;                              // for isi.user_id check
    const profileId   = await getInterviewerProfileId(userId);   // for ie.interviewer_id

    const [rows] = await db.query(
      `SELECT
         a.application_id   AS id,
         u.name             AS applicant_name,
         u.email            AS applicant_email,
         a.gender,
         a.phone,
         a.state,
         a.application_status AS status,
         a.created_at,
         a.updated_at,
         isl.slot_id,
         isl.slot_datetime  AS interview_datetime,
         ie.evaluation_id,
         ie.total_score,
         ie.updated_at      AS evaluated_at
       FROM applications a
       JOIN users u
         ON u.user_id = a.user_id
       JOIN interview_slots isl
         ON isl.slot_id = a.interview_slot_id
       JOIN interview_slot_interviewers isi
         ON isi.slot_id = isl.slot_id
        AND isi.user_id = ?
       LEFT JOIN interview_evaluations ie
         ON ie.application_id = a.application_id
        AND ie.interviewer_id = ?
       WHERE a.application_status IN ('interview', 'attended', 'passed', 'failed')
       ORDER BY isl.slot_datetime DESC, u.name ASC`,
      [userId, profileId]   // ← userId for slot check, profileId for eval join
    );

    return res.json({ applications: rows });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('getMyApplications:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/interviewer/applications/:id/evaluation
// ══════════════════════════════════════════════════════════
exports.getEvaluation = async (req, res) => {
  try {
    const profileId = await getInterviewerProfileId(req.user.id);
    const { id }    = req.params;

    const [rows] = await db.query(
      `SELECT * FROM interview_evaluations
       WHERE application_id = ? AND interviewer_id = ?`,
      [id, profileId]   // ← was req.user.id, now profileId
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'No evaluation found.' });

    return res.json({ evaluation: rows[0] });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('getEvaluation:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/interviewer/applications/:id/evaluate
// ══════════════════════════════════════════════════════════
exports.submitEvaluation = async (req, res) => {
  try {
    const userId    = req.user.id;
    const profileId = await getInterviewerProfileId(userId);
    const { id }    = req.params;

    const {
      a1_score, a2_score, a3_score,
      b1_score, b2_score, b3_score,
      c1_score, c2_score, c3_score,
      d1_score, d2_score, d3_score,
      remarks,
    } = req.body;

    const scoreFields = [
      a1_score, a2_score, a3_score,
      b1_score, b2_score, b3_score,
      c1_score, c2_score, c3_score,
      d1_score, d2_score, d3_score,
    ];
    for (const s of scoreFields) {
      const n = parseInt(s, 10);
      if (isNaN(n) || n < 1 || n > 5)
        return res.status(400).json({ message: 'All scores must be between 1 and 5.' });
    }

    // Slot assignment check still uses user_id (interview_slot_interviewers.user_id)
    const [check] = await db.query(
      `SELECT a.application_id
       FROM applications a
       JOIN interview_slot_interviewers isi ON isi.slot_id = a.interview_slot_id
       WHERE a.application_id = ? AND isi.user_id = ?`,
      [id, userId]   // ← userId, not profileId
    );
    if (check.length === 0)
      return res.status(403).json({ message: "You are not assigned to this applicant's interview slot." });

    const sum        = scoreFields.reduce((acc, s) => acc + parseInt(s, 10), 0);
    const totalScore = parseFloat(((sum / 60) * 100).toFixed(2));

    await db.query(
      `INSERT INTO interview_evaluations
         (application_id, interviewer_id,
          a1_score, a2_score, a3_score,
          b1_score, b2_score, b3_score,
          c1_score, c2_score, c3_score,
          d1_score, d2_score, d3_score,
          total_score, remarks, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         a1_score    = VALUES(a1_score),    a2_score = VALUES(a2_score), a3_score = VALUES(a3_score),
         b1_score    = VALUES(b1_score),    b2_score = VALUES(b2_score), b3_score = VALUES(b3_score),
         c1_score    = VALUES(c1_score),    c2_score = VALUES(c2_score), c3_score = VALUES(c3_score),
         d1_score    = VALUES(d1_score),    d2_score = VALUES(d2_score), d3_score = VALUES(d3_score),
         total_score = VALUES(total_score),
         remarks     = VALUES(remarks),
         updated_at  = NOW()`,
      [
        id, profileId,   // ← was interviewerId (user_id), now profileId
        a1_score, a2_score, a3_score,
        b1_score, b2_score, b3_score,
        c1_score, c2_score, c3_score,
        d1_score, d2_score, d3_score,
        totalScore, remarks || null,
      ]
    );

    return res.json({ message: 'Evaluation submitted successfully.', total_score: totalScore });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('submitEvaluation:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};