const express          = require('express');
const router           = express.Router();
const vacancyControllers = require('../controllers/vacancyControllers');
const { verifyToken, requirePartner } = require('../middleware/authMiddleware');

router.get   ('/partner/internship-vacancies',     verifyToken, requirePartner, vacancyControllers.listVacancies);
router.get   ('/partner/internship-vacancies/:id', verifyToken, requirePartner, vacancyControllers.getVacancy);
router.post  ('/partner/internship-vacancies',     verifyToken, requirePartner, vacancyControllers.createVacancy);
router.put   ('/partner/internship-vacancies/:id', verifyToken, requirePartner, vacancyControllers.updateVacancy);
router.delete('/partner/internship-vacancies/:id', verifyToken, requirePartner, vacancyControllers.deleteVacancy);


module.exports = router;