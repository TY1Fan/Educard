'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Performance Optimization Migration
     * Adds additional indexes for common query patterns and improves database performance
     */

    // ===== CATEGORIES TABLE =====
    // Slug is frequently used for lookups
    try {
      await queryInterface.addIndex('categories', ['slug'], {
        name: 'idx_categories_slug',
        unique: true
      });
    } catch (e) {
      console.log('Index idx_categories_slug may already exist');
    }

    // Display order for sorting categories
    try {
      await queryInterface.addIndex('categories', ['display_order'], {
        name: 'idx_categories_display_order'
      });
    } catch (e) {
      console.log('Index idx_categories_display_order may already exist');
    }

    // ===== THREADS TABLE =====
    // Compound index for category listing with sorting
    // Covers: category_id, is_pinned DESC, updated_at DESC
    try {
      await queryInterface.addIndex('threads', ['category_id', 'is_pinned', 'updated_at'], {
        name: 'idx_threads_category_pinned_updated'
      });
    } catch (e) {
      console.log('Index idx_threads_category_pinned_updated may already exist');
    }

    // Slug for thread lookups (if not already unique)
    try {
      await queryInterface.addIndex('threads', ['slug'], {
        name: 'idx_threads_slug',
        unique: true
      });
    } catch (e) {
      console.log('Index idx_threads_slug may already exist');
    }

    // User's threads listing
    try {
      await queryInterface.addIndex('threads', ['user_id', 'created_at'], {
        name: 'idx_threads_user_created'
      });
    } catch (e) {
      console.log('Index idx_threads_user_created may already exist');
    }

    // ===== POSTS TABLE =====
    // Compound index for finding last post in thread
    try {
      await queryInterface.addIndex('posts', ['thread_id', 'created_at'], {
        name: 'idx_posts_thread_created_desc'
      });
    } catch (e) {
      console.log('Index idx_posts_thread_created_desc may already exist');
    }

    // User's posts listing
    try {
      await queryInterface.addIndex('posts', ['user_id', 'created_at'], {
        name: 'idx_posts_user_created'
      });
    } catch (e) {
      console.log('Index idx_posts_user_created may already exist');
    }

    // Hidden posts filtering (for moderation)
    try {
      await queryInterface.addIndex('posts', ['is_hidden'], {
        name: 'idx_posts_is_hidden'
      });
    } catch (e) {
      console.log('Index idx_posts_is_hidden may already exist');
    }

    // ===== USERS TABLE =====
    // Username for lookups
    try {
      await queryInterface.addIndex('users', ['username'], {
        name: 'idx_users_username',
        unique: true
      });
    } catch (e) {
      console.log('Index idx_users_username may already exist');
    }

    // Email for login/lookups
    try {
      await queryInterface.addIndex('users', ['email'], {
        name: 'idx_users_email',
        unique: true
      });
    } catch (e) {
      console.log('Index idx_users_email may already exist');
    }

    // Active users filtering
    try {
      await queryInterface.addIndex('users', ['is_active'], {
        name: 'idx_users_is_active'
      });
    } catch (e) {
      console.log('Index idx_users_is_active may already exist');
    }

    // Banned users filtering
    try {
      await queryInterface.addIndex('users', ['is_banned'], {
        name: 'idx_users_is_banned'
      });
    } catch (e) {
      console.log('Index idx_users_is_banned may already exist');
    }

    // Role-based queries
    try {
      await queryInterface.addIndex('users', ['role'], {
        name: 'idx_users_role'
      });
    } catch (e) {
      console.log('Index idx_users_role may already exist');
    }

    // ===== NOTIFICATIONS TABLE =====
    // Unread notifications for a user (most common query)
    try {
      await queryInterface.addIndex('notifications', ['user_id', 'is_read', 'created_at'], {
        name: 'idx_notifications_user_unread_created'
      });
    } catch (e) {
      console.log('Index idx_notifications_user_unread_created may already exist');
    }

    // Notification type filtering
    try {
      await queryInterface.addIndex('notifications', ['type'], {
        name: 'idx_notifications_type'
      });
    } catch (e) {
      console.log('Index idx_notifications_type may already exist');
    }

    // ===== POST_REACTIONS TABLE =====
    // User's reactions (for checking if user has reacted)
    try {
      await queryInterface.addIndex('post_reactions', ['user_id', 'post_id'], {
        name: 'idx_post_reactions_user_post',
        unique: true
      });
    } catch (e) {
      console.log('Index idx_post_reactions_user_post may already exist');
    }

    // Post reactions count
    try {
      await queryInterface.addIndex('post_reactions', ['post_id', 'reaction_type'], {
        name: 'idx_post_reactions_post_type'
      });
    } catch (e) {
      console.log('Index idx_post_reactions_post_type may already exist');
    }

    // ===== REPORTS TABLE =====
    // Pending reports for moderation queue
    try {
      await queryInterface.addIndex('reports', ['status', 'created_at'], {
        name: 'idx_reports_status_created'
      });
    } catch (e) {
      console.log('Index idx_reports_status_created may already exist');
    }

    // Reports by type
    try {
      await queryInterface.addIndex('reports', ['report_type', 'reported_item_id'], {
        name: 'idx_reports_type_item'
      });
    } catch (e) {
      console.log('Index idx_reports_type_item may already exist');
    }

    // Reporter's reports
    try {
      await queryInterface.addIndex('reports', ['reporter_id'], {
        name: 'idx_reports_reporter_id'
      });
    } catch (e) {
      console.log('Index idx_reports_reporter_id may already exist');
    }

    console.log('✅ Performance indexes migration completed successfully');
  },

  async down (queryInterface, Sequelize) {
    /**
     * Rollback: Remove all performance indexes
     */
    
    const indexesToDrop = [
      // Categories
      { table: 'categories', index: 'idx_categories_slug' },
      { table: 'categories', index: 'idx_categories_display_order' },
      
      // Threads
      { table: 'threads', index: 'idx_threads_category_pinned_updated' },
      { table: 'threads', index: 'idx_threads_slug' },
      { table: 'threads', index: 'idx_threads_user_created' },
      
      // Posts
      { table: 'posts', index: 'idx_posts_thread_created_desc' },
      { table: 'posts', index: 'idx_posts_user_created' },
      { table: 'posts', index: 'idx_posts_is_hidden' },
      
      // Users
      { table: 'users', index: 'idx_users_username' },
      { table: 'users', index: 'idx_users_email' },
      { table: 'users', index: 'idx_users_is_active' },
      { table: 'users', index: 'idx_users_is_banned' },
      { table: 'users', index: 'idx_users_role' },
      
      // Notifications
      { table: 'notifications', index: 'idx_notifications_user_unread_created' },
      { table: 'notifications', index: 'idx_notifications_type' },
      
      // Post Reactions
      { table: 'post_reactions', index: 'idx_post_reactions_user_post' },
      { table: 'post_reactions', index: 'idx_post_reactions_post_type' },
      
      // Reports
      { table: 'reports', index: 'idx_reports_status_created' },
      { table: 'reports', index: 'idx_reports_type_item' },
      { table: 'reports', index: 'idx_reports_reporter_id' }
    ];

    for (const { table, index } of indexesToDrop) {
      try {
        await queryInterface.removeIndex(table, index);
      } catch (e) {
        console.log(`Index ${index} on ${table} may not exist or already removed`);
      }
    }

    console.log('✅ Performance indexes rollback completed');
  }
};
