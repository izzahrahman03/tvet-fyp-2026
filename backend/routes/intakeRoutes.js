const express          = require('express');
const router           = express.Router();
const intakeControllers  = require('../controllers/intakeControllers');
const { verifyToken, requireAdminOrManager } = require('../middleware/authMiddleware');

router.get   ('/intakes',     verifyToken, requireAdminOrManager, intakeControllers.listIntakes);
router.post  ('/intakes',     verifyToken, requireAdminOrManager, intakeControllers.createIntake);
router.put   ('/intakes/:id', verifyToken, requireAdminOrManager, intakeControllers.updateIntake);
router.delete('/intakes/:id', verifyToken, requireAdminOrManager, intakeControllers.deleteIntake);

module.exports = router;