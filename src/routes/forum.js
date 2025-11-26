const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { requireAuth } = require('../middlewares/auth');

/**
 * Forum Routes
 * Handles category and thread related routes
 */

// Category thread listing
router.get('/category/:slug', forumController.showCategoryThreads);

// New thread form (requires authentication)
router.get('/category/:slug/new-thread', requireAuth, forumController.showNewThread);

// Create new thread (requires authentication and validation)
router.post('/category/:slug/new-thread', 
  requireAuth, 
  forumController.createThreadValidation,
  forumController.createThread
);

// View thread with posts
router.get('/thread/:slug', forumController.showThread);

// Create reply to thread (requires authentication and validation)
router.post('/thread/:slug/reply', 
  requireAuth,
  forumController.createReplyValidation,
  forumController.createReply
);

// Edit post form (requires authentication)
router.get('/post/:id/edit', requireAuth, forumController.showEditPost);

// Update post (requires authentication and validation)
router.post('/post/:id/edit', 
  requireAuth,
  forumController.updatePostValidation,
  forumController.updatePost
);

// Delete post (requires authentication)
router.post('/post/:id/delete', requireAuth, forumController.deletePost);

// Delete thread (requires authentication)
router.post('/thread/:slug/delete', requireAuth, forumController.deleteThread);

// Pin/unpin thread (requires authentication)
router.post('/thread/:slug/pin', requireAuth, forumController.togglePin);

// Lock/unlock thread (requires authentication)
router.post('/thread/:slug/lock', requireAuth, forumController.toggleLock);

// Toggle post reaction (requires authentication)
router.post('/post/:id/react', requireAuth, forumController.toggleReaction);

// Get post reactions (public)
router.get('/post/:id/reactions', forumController.getPostReactions);

module.exports = router;
