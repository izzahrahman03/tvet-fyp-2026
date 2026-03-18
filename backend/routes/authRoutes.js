const express          = require('express');
const router           = express.Router();
const authControllers  = require('../controllers/authControllers');
const adminControllers = require('../controllers/adminControllers');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// ── Auth ──────────────────────────────────────────────────
router.post('/signup',               authControllers.signup);
router.post('/login',                authControllers.login);
router.post('/verify-activation',    authControllers.verifyActivation);
router.post('/set-password',         authControllers.setPassword);
router.post('/forgot-password',      authControllers.forgotPassword);
router.post('/validate-reset-token', authControllers.validateResetToken);
router.post('/reset-password',       authControllers.resetPassword);

// ── Admin: users ──────────────────────────────────────────
router.get   ('/admin/users',        verifyToken, requireAdmin, adminControllers.listUsers);
router.post  ('/admin/users/import', verifyToken, requireAdmin, adminControllers.importUsers);
router.post  ('/admin/users',        verifyToken, requireAdmin, adminControllers.addUserByAdmin);
router.put   ('/admin/users/:id',    verifyToken, requireAdmin, adminControllers.updateUser);
router.delete('/admin/users/:id',    verifyToken, requireAdmin, adminControllers.deleteUser);
router.get   ('/admin/stats',        verifyToken, requireAdmin, adminControllers.getStats);
router.get   ('/admin/partners',     verifyToken, requireAdmin, adminControllers.listPartners);

module.exports = router;