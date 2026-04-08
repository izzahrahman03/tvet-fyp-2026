const express               = require('express');
const router                = express.Router();
const internshipControllers = require('../controllers/internshipControllers');
const { verifyToken, requirePartner }       = require('../middleware/authMiddleware');

router.get ('/student/internship-vacancies',       verifyToken, internshipControllers.listVacancies);
router.post('/student/internship-apply',           verifyToken, internshipControllers.upload, internshipControllers.applyVacancy);
router.get ('/student/my-internship-applications', verifyToken, internshipControllers.myApplications);

router.post('/student/internship-accept/:id',   verifyToken, internshipControllers.acceptOffer);
router.post('/student/internship-decline/:id',  verifyToken, internshipControllers.declineOffer);
router.post('/student/internship-withdraw/:id', verifyToken, internshipControllers.requestWithdraw);

module.exports = router;