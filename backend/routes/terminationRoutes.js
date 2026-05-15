const express          = require('express');
const router           = express.Router();
const terminationControllers = require('../controllers/terminationControllers');
const { verifyToken, requireAdmin, requireSupervisor} = require('../middleware/authMiddleware');

// Supervisor
router.get('/supervisor/active-interns',   verifyToken, requireSupervisor, terminationControllers.listActiveInterns);
router.post('/supervisor/termination-form',    verifyToken, requireSupervisor, terminationControllers.submitTermination);
router.get('/supervisor/termination-form',     verifyToken, requireSupervisor, terminationControllers.myTerminations);

// Admin
router.get('/admin/internship/termination-requests',    verifyToken, requireAdmin, terminationControllers.adminListTerminations);
router.put('/admin/internship/termination-requests/:id',verifyToken, requireAdmin, terminationControllers.processTermination);

module.exports = router;