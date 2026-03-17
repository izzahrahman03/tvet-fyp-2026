// routes/profileRoutes.js

const express            = require('express');
const router             = express.Router();
const profileControllers = require('../controllers/profileControllers');
const { verifyToken }    = require('../middleware/authMiddleware');

// All profile routes require a valid JWT
router.get('/profile',          verifyToken, profileControllers.getProfile);
router.put('/profile',          verifyToken, profileControllers.updateProfile);
router.put('/profile/password', verifyToken, profileControllers.updatePassword);

module.exports = router;