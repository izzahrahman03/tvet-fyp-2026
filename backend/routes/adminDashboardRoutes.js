const express          = require('express');
const router           = express.Router();
const adminDashboardControllers = require('../controllers/adminDashboardControllers');
const { verifyToken, requireAdminOrManager } = require('../middleware/authMiddleware');

router.get('/admin-dashboard', verifyToken, requireAdminOrManager, adminDashboardControllers.getDashboardStats);

module.exports = router;