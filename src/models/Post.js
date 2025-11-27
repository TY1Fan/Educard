const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Post Model
 * Represents individual replies/posts within a thread.
 * The first post in a thread is marked with isFirstPost=true.
 */
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  threadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'thread_id',
    references: {
      model: 'threads',
      key: 'id'
    },
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'Thread ID is required'
      }
    }
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
    validate: {
      notNull: {
        msg: 'User ID is required'
      }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Post content is required'
      },
      notEmpty: {
        msg: 'Post content cannot be empty'
      },
      len: {
        args: [1, 10000],
        msg: 'Post content must be between 1 and 10,000 characters'
      }
    }
  },
  isFirstPost: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_first_post',
    validate: {
      isBoolean: {
        msg: 'isFirstPost must be a boolean value'
      }
    }
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at'
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_hidden',
    comment: 'Whether the post is hidden by moderators'
  },
  hiddenBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'hidden_by',
    comment: 'Moderator who hid this post'
  },
  hiddenAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'hidden_at',
    comment: 'When the post was hidden'
  },
  hiddenReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'hidden_reason',
    comment: 'Reason for hiding the post'
  }
}, {
  tableName: 'posts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_posts_thread_id',
      fields: ['thread_id']
    },
    {
      name: 'idx_posts_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_posts_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_posts_thread_created',
      fields: ['thread_id', 'created_at']
    },
    {
      name: 'idx_posts_is_first',
      fields: ['is_first_post']
    }
  ]
});

module.exports = Post;
