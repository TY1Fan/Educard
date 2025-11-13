const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Category Model
 * Represents a forum category (e.g., "General Discussion", "Homework Help")
 */
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Category name cannot be empty'
      },
      len: {
        args: [1, 100],
        msg: 'Category name must be between 1 and 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'This slug is already in use'
    },
    validate: {
      is: {
        args: /^[a-z0-9-]+$/,
        msg: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    }
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'display_order',
    validate: {
      isInt: {
        msg: 'Display order must be an integer'
      }
    }
  }
}, {
  tableName: 'categories',
  timestamps: true,
  updatedAt: false, // Categories don't need updatedAt
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['display_order']
    }
  ]
});

module.exports = Category;
