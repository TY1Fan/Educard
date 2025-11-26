const { Notification, User } = require('../models');

/**
 * Notification Service
 * Handles creation and management of user notifications
 */

class NotificationService {
  /**
   * Create a notification for a user
   * @param {Object} data - Notification data
   * @param {number} data.userId - ID of user to notify
   * @param {string} data.type - Notification type (reply, mention, like, thread_reply)
   * @param {string} data.content - Notification message
   * @param {number} data.relatedId - ID of related entity
   * @param {string} data.relatedType - Type of related entity
   * @param {string} data.actionUrl - URL to navigate when clicked
   * @param {number} data.actorId - ID of user who triggered the notification
   * @returns {Promise<Notification>}
   */
  static async createNotification(data) {
    try {
      // Don't notify users about their own actions
      if (data.userId === data.actorId) {
        return null;
      }

      const notification = await Notification.create({
        userId: data.userId,
        type: data.type,
        content: data.content,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        actionUrl: data.actionUrl,
        actorId: data.actorId
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notify thread author when someone replies to their thread
   * @param {Object} thread - Thread object
   * @param {Object} post - New post/reply object
   * @param {Object} author - User who created the reply
   */
  static async notifyThreadReply(thread, post, author) {
    if (!thread || !post || !author) return;

    const content = `${author.username} replied to your thread "${thread.title}"`;
    
    await this.createNotification({
      userId: thread.userId,
      type: 'thread_reply',
      content: content,
      relatedId: post.id,
      relatedType: 'post',
      actionUrl: `/thread/${thread.slug}#post-${post.id}`,
      actorId: author.id
    });
  }

  /**
   * Notify post author when someone replies to their post
   * @param {Object} parentPost - Parent post being replied to
   * @param {Object} replyPost - New reply post
   * @param {Object} author - User who created the reply
   */
  static async notifyPostReply(parentPost, replyPost, author) {
    if (!parentPost || !replyPost || !author) return;

    const content = `${author.username} replied to your post`;
    
    await this.createNotification({
      userId: parentPost.userId,
      type: 'reply',
      content: content,
      relatedId: replyPost.id,
      relatedType: 'post',
      actionUrl: replyPost.actionUrl || '#',
      actorId: author.id
    });
  }

  /**
   * Notify user when their post is liked
   * @param {Object} post - Post that was liked
   * @param {Object} liker - User who liked the post
   */
  static async notifyPostLike(post, liker) {
    if (!post || !liker) return;

    const content = `${liker.username} liked your post`;
    
    await this.createNotification({
      userId: post.userId,
      type: 'like',
      content: content,
      relatedId: post.id,
      relatedType: 'post',
      actionUrl: `#post-${post.id}`,
      actorId: liker.id
    });
  }

  /**
   * Notify users mentioned in a post (@username)
   * @param {string} content - Post content to scan for mentions
   * @param {Object} post - Post object
   * @param {Object} author - User who created the post
   */
  static async notifyMentions(content, post, author) {
    if (!content || !post || !author) return;

    // Extract @username mentions using regex
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);

    if (!mentions || mentions.length === 0) return;

    // Get unique usernames (remove @ symbol)
    const usernames = [...new Set(mentions.map(m => m.substring(1)))];

    // Find users by username
    const users = await User.findAll({
      where: { username: usernames },
      attributes: ['id', 'username']
    });

    // Create notification for each mentioned user
    for (const user of users) {
      const notificationContent = `${author.username} mentioned you in a post`;
      
      await this.createNotification({
        userId: user.id,
        type: 'mention',
        content: notificationContent,
        relatedId: post.id,
        relatedType: 'post',
        actionUrl: `#post-${post.id}`,
        actorId: author.id
      });
    }
  }

  /**
   * Get unread notification count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>}
   */
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>}
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId: userId }
      });

      if (!notification) return false;

      await notification.update({
        isRead: true,
        readAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of notifications updated
   */
  static async markAllAsRead(userId) {
    try {
      const [count] = await Notification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            userId: userId,
            isRead: false
          }
        }
      );

      return count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete old read notifications (cleanup task)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<number>} Number of notifications deleted
   */
  static async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const count = await Notification.destroy({
        where: {
          isRead: true,
          readAt: {
            [require('sequelize').Op.lt]: cutoffDate
          }
        }
      });

      return count;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }
}

module.exports = NotificationService;
