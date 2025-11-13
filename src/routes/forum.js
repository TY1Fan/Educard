const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

/**
 * Forum Routes
 * Handles category and thread related routes
 */

// Category thread listing
router.get('/category/:slug', forumController.showCategoryThreads);

module.exports = router;
