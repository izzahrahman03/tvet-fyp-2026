const express = require('express');
const router  = express.Router();

const { verifyToken, requireAdminOrManager } = require('../middleware/authMiddleware');
const applicationControllers        = require('../controllers/applicationControllers');

router.post('/application-form', verifyToken, applicationControllers.uploadMiddleware, applicationControllers.submitApplication);
router.get ('/my-application',          verifyToken, applicationControllers.getMyApplication);
router.post('/my-application/accept',   verifyToken, applicationControllers.acceptOffer);
router.post('/my-application/decline', verifyToken, applicationControllers.declineOffer);
router.get ('/interview-slots',         verifyToken, applicationControllers.listInterviewSlots);

router.get   ('/applications',            verifyToken, requireAdminOrManager, applicationControllers.listApplications);
router.get   ('/applications/:id',        verifyToken, requireAdminOrManager, applicationControllers.getApplication);
router.put   ('/applications/:id/status', verifyToken, requireAdminOrManager, applicationControllers.updateApplicationStatus);
router.delete('/applications/:id',        verifyToken, requireAdminOrManager, applicationControllers.deleteApplication);


module.exports = router;