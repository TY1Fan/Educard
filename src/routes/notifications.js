const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middlewares/auth');

/**
 * Notification Routes
 * All routes require authentication
 */

// Get notifications page
router.get('/', requireAuth, notificationController.getNotifications);

// Get notifications (JSON API for AJAX)
router.get('/api/notifications', requireAuth, notificationController.getNotificationsJson);

// Get unread count (JSON API)
router.get('/api/unread-count', requireAuth, notificationController.getUnreadCount);

// Mark notification as read
router.post('/:id/read', requireAuth, notificationController.markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', requireAuth, notificationController.markAllAsRead);

// Delete notification
router.post('/:id/delete', requireAuth, notificationController.deleteNotification);

module.exports = router;
