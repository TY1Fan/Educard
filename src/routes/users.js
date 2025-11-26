const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * User Routes
 * Handles user profile and related routes
 */

// User profile
router.get('/profile/:username', userController.showProfile);

module.exports = router;
