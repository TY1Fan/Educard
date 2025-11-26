const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/auth');

/**
 * User Routes
 * Handles user profile and related routes
 */

// Edit profile form (requires authentication) - must come before :username route
router.get('/profile/edit', requireAuth, userController.showEditProfile);

// User profile
router.get('/profile/:username', userController.showProfile);

module.exports = router;
