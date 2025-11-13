const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireGuest, requireAuth } = require('../middlewares/auth');

// Registration routes (guest only)
router.get('/register', requireGuest, authController.showRegister);
router.post('/register', requireGuest, authController.registerValidation, authController.register);

// Login routes (guest only)
router.get('/login', requireGuest, authController.showLogin);
router.post('/login', requireGuest, authController.login);

// Logout routes (authenticated only)
router.post('/logout', requireAuth, authController.logout);
router.get('/logout', requireAuth, authController.logout); // Also allow GET for convenience

module.exports = router;
