const express          = require('express');
const router           = express.Router();
const adminControllers = require('../controllers/adminControllers');
const applicationControllers = require('../controllers/applicationControllers');
const adminPlacementControllers = require('../controllers/adminPlacementControllers');
const { verifyToken, requireAdmin, requireManager, requireAdminOrManager } = require('../middleware/authMiddleware');

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
router.get   ('/admin/interview-slots',     verifyToken, requireAdminOrManager,          applicationControllers.listInterviewSlotsAdmin);
router.post  ('/interview-slots',     verifyToken, requireAdminOrManager,          applicationControllers.createInterviewSlot);
router.put   ('/interview-slots/:id', verifyToken, requireAdminOrManager,          applicationControllers.updateInterviewSlot);
router.delete('/interview-slots/:id', verifyToken, requireAdminOrManager,          applicationControllers.deleteInterviewSlot);

// ── Admin: interviewers dropdown (admin + manager) ────────
router.get('/admin/interviewers', verifyToken, requireAdminOrManager, adminControllers.listInterviewers);

// ── Manager only: stats ───────────────────────────────────
router.get('/manager/stats', verifyToken, requireManager, adminControllers.getManagerStats);

// ── Admin: placements + evaluations ─────────────────────────
router.get('/admin/internship/placements', verifyToken, requireAdmin, adminPlacementControllers.listPlacements);
router.get('/admin/internship/placements/:studentId/applications', verifyToken, requireAdmin, adminPlacementControllers.getStudentApplications);
router.get('/admin/internship/evaluations', verifyToken, requireAdmin, adminPlacementControllers.listEvaluations);

module.exports = router;