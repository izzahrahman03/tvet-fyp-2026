const express          = require('express');
const router           = express.Router();
const adminControllers = require('../controllers/adminControllers');
const applicationControllers = require('../controllers/applicationControllers');
const { verifyToken, requireAdmin, requireManager } = require('../middleware/authMiddleware');

// ── Admin: users ──────────────────────────────────────────
router.get   ('/admin/users',        verifyToken, requireAdmin, adminControllers.listUsers);
router.post  ('/admin/users/import', verifyToken, requireAdmin, adminControllers.importUsers);
router.post  ('/admin/users',        verifyToken, requireAdmin, adminControllers.addUserByAdmin);
router.put   ('/admin/users/:id',    verifyToken, requireAdmin, adminControllers.updateUser);
router.delete('/admin/users/:id',    verifyToken, requireAdmin, adminControllers.deleteUser);

// ── Admin: partners dropdown ──────────────────────────────
router.get   ('/admin/partners',     verifyToken, requireAdmin, adminControllers.listPartners);

// ── Admin: stats ──────────────────────────────────────────
router.get   ('/admin/stats',        verifyToken, requireAdmin, adminControllers.getStats);

// ── Admin: interview slots (admin + manager) ──────────────
router.post  ('/interview-slots',     verifyToken, requireAdmin,          applicationControllers.createInterviewSlot);
router.delete('/interview-slots/:id', verifyToken, requireAdmin,          applicationControllers.deleteInterviewSlot);

// ── Manager only: stats ───────────────────────────────────
router.get('/manager/stats', verifyToken, requireManager, adminControllers.getManagerStats);

module.exports = router;