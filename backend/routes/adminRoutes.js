const express          = require('express');
const router           = express.Router();
const adminControllers = require('../controllers/adminControllers');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// ── Admin: users ──────────────────────────────────────────
router.get   ('/admin/users',        verifyToken, requireAdmin, adminControllers.listUsers);
router.post  ('/admin/users/import', verifyToken, requireAdmin, adminControllers.importUsers);
router.post  ('/admin/users',        verifyToken, requireAdmin, adminControllers.addUserByAdmin);
router.put   ('/admin/users/:id',    verifyToken, requireAdmin, adminControllers.updateUser);
router.delete('/admin/users/:id',    verifyToken, requireAdmin, adminControllers.deleteUser);
router.get   ('/admin/stats',        verifyToken, requireAdmin, adminControllers.getStats);

module.exports = router;