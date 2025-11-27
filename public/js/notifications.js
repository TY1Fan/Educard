/**
 * Notifications Handler
 * Manages notification badge updates and real-time polling
 */

class NotificationManager {
  constructor() {
    this.badge = document.getElementById('notification-badge');
    this.pollInterval = null;
    this.pollFrequency = 30000; // Poll every 30 seconds
    
    if (this.badge) {
      this.init();
    }
  }

  init() {
    // Initial fetch
    this.updateBadge();
    
    // Start polling
    this.startPolling();
    
    // Stop polling when page is hidden (save resources)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopPolling();
      } else {
        this.startPolling();
      }
    });
  }

  async updateBadge() {
    try {
      const response = await fetch('/notifications/api/unread-count');
      const data = await response.json();

      if (data.success && typeof data.count === 'number') {
        this.setBadgeCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }

  setBadgeCount(count) {
    if (!this.badge) return;

    if (count > 0) {
      this.badge.textContent = count > 99 ? '99+' : count;
      this.badge.dataset.count = count;
      this.badge.style.display = 'flex';
      
      // Add animation
      this.badge.classList.add('notification-pulse');
      setTimeout(() => {
        this.badge.classList.remove('notification-pulse');
      }, 300);
    } else {
      this.badge.style.display = 'none';
      this.badge.dataset.count = '0';
    }
  }

  startPolling() {
    if (this.pollInterval) return;
    
    this.pollInterval = setInterval(() => {
      this.updateBadge();
    }, this.pollFrequency);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Mark notification as read (for use on notifications page)
   */
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        this.setBadgeCount(data.unreadCount);
        return true;
      } else {
        console.error('Failed to mark notification as read:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await fetch('/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        this.setBadgeCount(0);
        return true;
      } else {
        console.error('Failed to mark all notifications as read:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`/notifications/${notificationId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        this.setBadgeCount(data.unreadCount);
        return true;
      } else {
        console.error('Failed to delete notification:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
}

/**
 * Moderation Manager
 * Manages moderation queue badge for moderators
 */
class ModerationManager {
  constructor() {
    this.badge = document.getElementById('moderation-badge');
    this.pollInterval = null;
    this.pollFrequency = 60000; // Poll every 60 seconds
    
    if (this.badge) {
      this.init();
    }
  }

  init() {
    // Initial fetch
    this.updateBadge();
    
    // Start polling
    this.startPolling();
    
    // Stop polling when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopPolling();
      } else {
        this.startPolling();
      }
    });
  }

  async updateBadge() {
    try {
      const response = await fetch('/moderation/api/pending-count');
      const data = await response.json();

      if (data.success && typeof data.count === 'number') {
        this.setBadgeCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching moderation count:', error);
    }
  }

  setBadgeCount(count) {
    if (!this.badge) return;

    if (count > 0) {
      this.badge.textContent = count > 99 ? '99+' : count;
      this.badge.dataset.count = count;
      this.badge.style.display = 'flex';
    } else {
      this.badge.style.display = 'none';
      this.badge.dataset.count = '0';
    }
  }

  startPolling() {
    if (this.pollInterval) return;
    
    this.pollInterval = setInterval(() => {
      this.updateBadge();
    }, this.pollFrequency);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if user is authenticated (badge exists)
  const notificationBadge = document.getElementById('notification-badge');
  if (notificationBadge) {
    window.notificationManager = new NotificationManager();
  }

  // Initialize moderation manager for moderators
  const moderationBadge = document.getElementById('moderation-badge');
  if (moderationBadge) {
    window.moderationManager = new ModerationManager();
  }
});
