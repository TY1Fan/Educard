const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Notification Model
 * Stores user notifications for various events (replies, mentions, likes)
 */
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'User who will receive this notification'
  },
  type: {
    type: DataTypes.ENUM('reply', 'mention', 'like', 'thread_reply'),
    allowNull: false,
    comment: 'Type of notification: reply (reply to own post), mention (@username), like (post liked), thread_reply (reply to own thread)'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Notification message content'
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_id',
    comment: 'ID of related entity (post_id, thread_id, etc.)'
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'related_type',
    comment: 'Type of related entity: post, thread, user'
  },
  actionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'action_url',
    comment: 'URL to navigate when notification is clicked'
  },
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'actor_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'User who triggered this notification'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_read',
    comment: 'Whether notification has been read'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
    comment: 'Timestamp when notification was read'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      name: 'notifications_user_id_idx',
      fields: ['user_id']
    },
    {
      name: 'notifications_is_read_idx',
      fields: ['is_read']
    },
    {
      name: 'notifications_user_unread_idx',
      fields: ['user_id', 'is_read']
    },
    {
      name: 'notifications_created_at_idx',
      fields: ['created_at']
    }
  ]
});

module.exports = Notification;
