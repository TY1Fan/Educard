const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration routes
router.get('/register', authController.showRegister);
router.post('/register', authController.registerValidation, authController.register);

// Login routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

module.exports = router;
