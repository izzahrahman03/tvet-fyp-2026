const express          = require('express');
const router           = express.Router();
const intakeControllers  = require('../controllers/intakeControllers');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get   ('/admin/intakes',     verifyToken, requireAdmin, intakeControllers.listIntakes);
router.post  ('/admin/intakes',     verifyToken, requireAdmin, intakeControllers.createIntake);
router.put   ('/admin/intakes/:id', verifyToken, requireAdmin, intakeControllers.updateIntake);
router.delete('/admin/intakes/:id', verifyToken, requireAdmin, intakeControllers.deleteIntake);

module.exports = router;