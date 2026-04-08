const express               = require('express');
const router                = express.Router();
const internshipApplicationControllers = require('../controllers/internshipApplicationControllers');
const { verifyToken, requirePartner }       = require('../middleware/authMiddleware');

router.get ('/partner/internship-applications',                verifyToken, requirePartner, internshipApplicationControllers.listApplications);
router.put ('/partner/internship-applications/:id/status',    verifyToken, requirePartner, internshipApplicationControllers.updateApplicationStatus);
router.get ('/partner/internship-applications/:id/download/:type', verifyToken, requirePartner, internshipApplicationControllers.downloadDocument);
router.put ('/partner/internship-applications/:id/approve-withdraw', verifyToken, requirePartner, internshipApplicationControllers.approveWithdraw);

module.exports = router;