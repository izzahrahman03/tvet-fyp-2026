const express               = require('express');
const router                = express.Router();
const internshipApplicationControllers = require('../controllers/internshipApplicationControllers');
const intakeControllers = require('../controllers/intakeControllers');
const { verifyToken, requirePartner }       = require('../middleware/authMiddleware');

router.get ('/partner/internship-applications',                verifyToken, requirePartner, internshipApplicationControllers.listApplications);
router.put ('/partner/internship-applications/:id/status',    verifyToken, requirePartner, internshipApplicationControllers.updateApplicationStatus);
router.get ('/partner/internship-applications/:id/download/:type', verifyToken, requirePartner, internshipApplicationControllers.downloadDocument);
router.put ('/partner/internship-applications/:id/approve-withdraw', verifyToken, requirePartner, internshipApplicationControllers.approveWithdraw);

router.get('/partner/supervisors', verifyToken, requirePartner, internshipApplicationControllers.listSupervisors);
router.put('/partner/internship-applications/:id/assign-supervisor', verifyToken, requirePartner, internshipApplicationControllers.assignSupervisor);
router.put('/partner/internship-applications/bulk-assign-supervisor', verifyToken, requirePartner, internshipApplicationControllers.bulkAssignSupervisor);

router.get('/partner/interns',             verifyToken, requirePartner, internshipApplicationControllers.listInterns);
router.put('/partner/interns/:id/status',  verifyToken, requirePartner, internshipApplicationControllers.updateInternStatus);

module.exports = router;