const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Thread Model
 * Represents a discussion thread/topic in a category
 */
const Thread = sequelize.define('Thread', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: {
      model: 'categories',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Thread title cannot be empty'
      },
      len: {
        args: [1, 255],
        msg: 'Thread title must be between 1 and 255 characters'
      }
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      is: {
        args: /^[a-z0-9-]+$/,
        msg: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    }
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_pinned'
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_locked'
  }
}, {
  tableName: 'threads',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['category_id', 'slug'],
      name: 'threads_category_slug_unique'
    },
    {
      fields: ['category_id'],
      name: 'threads_category_id_index'
    },
    {
      fields: ['user_id'],
      name: 'threads_user_id_index'
    },
    {
      fields: ['updated_at'],
      name: 'threads_updated_at_index'
    },
    {
      fields: ['is_pinned'],
      name: 'threads_is_pinned_index'
    }
  ]
});

module.exports = Thread;
