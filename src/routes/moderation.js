const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const requireModerator = require('../middlewares/requireModerator');
const { requireAuth } = require('../middlewares/auth');

/**
 * Moderation Routes
 * Routes for content moderation and report management
 */

// Public route for submitting reports (requires authentication)
router.post('/report', requireAuth, moderationController.submitReport);

// Moderator-only routes
router.use(requireModerator);

// API endpoints
router.get('/api/pending-count', moderationController.apiPendingCount);

// Moderation queue
router.get('/queue', moderationController.showQueue);

// Report actions
router.post('/reports/:id/resolve', moderationController.resolveReport);

// Post moderation
router.post('/posts/:id/hide', moderationController.hidePost);
router.post('/posts/:id/unhide', moderationController.unhidePost);

// Thread moderation
router.post('/threads/:id/move', moderationController.moveThread);

module.exports = router;
