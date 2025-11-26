'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'User who will receive this notification'
      },
      type: {
        type: Sequelize.ENUM('reply', 'mention', 'like', 'thread_reply'),
        allowNull: false,
        comment: 'Type of notification'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Notification message content'
      },
      related_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of related entity (post_id, thread_id, etc.)'
      },
      related_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Type of related entity: post, thread, user'
      },
      action_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL to navigate when notification is clicked'
      },
      actor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'User who triggered this notification'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether notification has been read'
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when notification was read'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index for finding user's notifications efficiently
    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'notifications_user_id_idx'
    });

    // Index for filtering unread notifications
    await queryInterface.addIndex('notifications', ['is_read'], {
      name: 'notifications_is_read_idx'
    });

    // Composite index for finding user's unread notifications (most common query)
    await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
      name: 'notifications_user_unread_idx'
    });

    // Index for ordering by creation time
    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'notifications_created_at_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};
