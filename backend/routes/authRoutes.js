const express          = require('express');
const router           = express.Router();
const authControllers  = require('../controllers/authControllers');

// ── Auth ──────────────────────────────────────────────────
router.post('/signup',               authControllers.signup);
router.post('/login',                authControllers.login);
router.post('/verify-activation',    authControllers.verifyActivation);
router.post('/set-password',         authControllers.setPassword);
router.post('/forgot-password',      authControllers.forgotPassword);
router.post('/validate-reset-token', authControllers.validateResetToken);
router.post('/reset-password',       authControllers.resetPassword);

module.exports = router;