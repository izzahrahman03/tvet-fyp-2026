const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware'); // ✅ FIX 1: import from auth middleware, not applicationControllers
const applicationControllers = require('../controllers/applicationControllers'); // ✅ FIX 2: applicationControllers was never imported

router.post('/application-form', verifyToken, applicationControllers.uploadMiddleware, applicationControllers.submitApplication);

// ── Applicant: my application ─────────────────────────────
router.get ('/my-application',          verifyToken, applicationControllers.getMyApplication);
router.post('/my-application/accept',   verifyToken, applicationControllers.acceptOffer);   // ✅ new
router.post('/my-application/withdraw', verifyToken, applicationControllers.withdrawOffer); // ✅ new

router.get ('/applications',            verifyToken, requireAdmin, applicationControllers.adminListApplications);
router.get ('/applications/:id',        verifyToken, requireAdmin, applicationControllers.adminGetApplication);
router.put ('/applications/:id/status', verifyToken, requireAdmin, applicationControllers.adminUpdateStatus);

module.exports = router; // ✅ FIX 3: router was never exported — server.js was loading undefined