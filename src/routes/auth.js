const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireGuest, requireAuth } = require('../middlewares/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Registration routes (guest only, with rate limiting)
router.get('/register', requireGuest, authController.showRegister);
router.post('/register', authLimiter, requireGuest, authController.registerValidation, authController.register);

// Login routes (guest only, with rate limiting)
router.get('/login', requireGuest, authController.showLogin);
router.post('/login', authLimiter, requireGuest, authController.login);

// Logout routes (authenticated only)
router.post('/logout', requireAuth, authController.logout);
router.get('/logout', requireAuth, authController.logout); // Also allow GET for convenience

module.exports = router;
