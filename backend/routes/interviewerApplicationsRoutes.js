const express          = require('express');
const router           = express.Router();
const interviewerApplicationsControllers = require('../controllers/interviewerApplicationsControllers');
const { verifyToken, requireInterviewer } = require('../middleware/authMiddleware');

// ── Interviewer: applications ─────────────────────────────
router.get   ('/interviewer/applications',        verifyToken, requireInterviewer, interviewerApplicationsControllers.getMyApplications);
router.get   ('/interviewer/applications/:id/evaluation', verifyToken, requireInterviewer, interviewerApplicationsControllers.getEvaluation);
router.post  ('/interviewer/applications/:id/evaluate',   verifyToken, requireInterviewer, interviewerApplicationsControllers.submitEvaluation);

module.exports = router;