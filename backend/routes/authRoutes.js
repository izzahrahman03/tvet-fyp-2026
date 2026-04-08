const express          = require('express');
const router           = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const authControllers  = require('../controllers/authControllers');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' }
});

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

router.post('/login', loginLimiter, validateLogin, authControllers.login);

// ── Auth ──────────────────────────────────────────────────
router.post('/signup',               authControllers.signup);
router.post('/login',                authControllers.login);
router.post('/verify-activation',    authControllers.verifyActivation);
router.post('/set-password',         authControllers.setPassword);
router.post('/forgot-password',      authControllers.forgotPassword);
router.post('/validate-reset-token', authControllers.validateResetToken);
router.post('/reset-password',       authControllers.resetPassword);

module.exports = router;