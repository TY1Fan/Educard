const { Notification, User } = require('../models');
const NotificationService = require('../services/notificationService');
const { Op } = require('sequelize');

/**
 * Notification Controller
 * Handles notification-related operations
 */

/**
 * Get Notifications Page
 * Displays all notifications for the current user
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Fetch notifications with actor information
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { userId },
      include: [{
        model: User,
        as: 'actor',
        attributes: ['id', 'username', 'displayName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render('pages/notifications', {
      title: 'Notifications',
      notifications,
      currentPage: page,
      totalPages,
      totalNotifications: count,
      isAuthenticated: true,
      user: req.session.user,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    req.flash('error', 'Failed to load notifications');
    res.redirect('/');
  }
};

/**
 * Get Notifications (JSON API)
 * Returns notifications for AJAX requests
 */
exports.getNotificationsJson = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const unreadOnly = req.query.unread === 'true';

    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await Notification.findAll({
      where,
      include: [{
        model: User,
        as: 'actor',
        attributes: ['id', 'username', 'displayName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit
    });

    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications (JSON):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load notifications'
    });
  }
};

/**
 * Get Unread Count (JSON API)
 * Returns count of unread notifications
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      count: 0
    });
  }
};

/**
 * Mark Notification as Read
 * Marks a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const success = await NotificationService.markAsRead(id, userId);

    if (success) {
      // If it's an AJAX request, return JSON
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        const unreadCount = await NotificationService.getUnreadCount(userId);
        return res.json({
          success: true,
          message: 'Notification marked as read',
          unreadCount
        });
      }

      req.flash('success', 'Notification marked as read');
      res.redirect('/notifications');
    } else {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      req.flash('error', 'Notification not found');
      res.redirect('/notifications');
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }

    req.flash('error', 'Failed to mark notification as read');
    res.redirect('/notifications');
  }
};

/**
 * Mark All Notifications as Read
 * Marks all user's notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const count = await NotificationService.markAllAsRead(userId);

    // If it's an AJAX request, return JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({
        success: true,
        message: `${count} notifications marked as read`,
        count,
        unreadCount: 0
      });
    }

    req.flash('success', `${count} notifications marked as read`);
    res.redirect('/notifications');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read'
      });
    }

    req.flash('error', 'Failed to mark notifications as read');
    res.redirect('/notifications');
  }
};

/**
 * Delete Notification
 * Deletes a single notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      req.flash('error', 'Notification not found');
      return res.redirect('/notifications');
    }

    await notification.destroy();

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const unreadCount = await NotificationService.getUnreadCount(userId);
      return res.json({
        success: true,
        message: 'Notification deleted',
        unreadCount
      });
    }

    req.flash('success', 'Notification deleted');
    res.redirect('/notifications');
  } catch (error) {
    console.error('Error deleting notification:', error);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }

    req.flash('error', 'Failed to delete notification');
    res.redirect('/notifications');
  }
};

module.exports = exports;
