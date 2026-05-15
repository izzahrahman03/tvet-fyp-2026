const express            = require('express');
const router             = express.Router();
const intakeControllers  = require('../controllers/intakeControllers');
const { verifyToken, requireAdminOrManagerOrPartner, requireAdminOrManager } = require('../middleware/authMiddleware');

router.get   ('/intakes',     verifyToken, requireAdminOrManagerOrPartner, intakeControllers.listIntakes);
router.post  ('/intakes',     verifyToken, requireAdminOrManager,        intakeControllers.createIntake);
router.put   ('/intakes/:id', verifyToken, requireAdminOrManager,        intakeControllers.updateIntake);
router.delete('/intakes/:id', verifyToken, requireAdminOrManager,        intakeControllers.deleteIntake);

router.get('/intake/window', intakeControllers.checkApplicationWindow);

module.exports = router;