const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration routes
router.get('/register', authController.showRegister);
router.post('/register', authController.registerValidation, authController.register);

module.exports = router;
