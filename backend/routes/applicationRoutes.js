const express = require('express');
const router  = express.Router();

const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const applicationControllers        = require('../controllers/applicationControllers');

// ── Applicant: submit / update application ────────────────
router.post('/application-form', verifyToken, applicationControllers.uploadMiddleware, applicationControllers.submitApplication);

// ── Applicant: my application ─────────────────────────────
router.get ('/my-application',          verifyToken, applicationControllers.getMyApplication);
router.post('/my-application/accept',   verifyToken, applicationControllers.acceptOffer);
router.post('/my-application/withdraw', verifyToken, applicationControllers.withdrawOffer);

// ── Admin: applications ───────────────────────────────────
router.get   ('/admin/applications',            verifyToken, requireAdmin, applicationControllers.adminListApplications);
router.get   ('/admin/applications/:id',        verifyToken, requireAdmin, applicationControllers.adminGetApplication);
router.put   ('/admin/applications/:id/status', verifyToken, requireAdmin, applicationControllers.adminUpdateStatus);
router.delete('/admin/applications/:id',        verifyToken, requireAdmin, applicationControllers.adminDeleteApplication);
// ── FIX: DELETE route was missing entirely — the frontend's deleteApplication()
//         was calling DELETE /admin/applications/:id with no handler on the
//         backend, causing every delete action to fail.

module.exports = router;