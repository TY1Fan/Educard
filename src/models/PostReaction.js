const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * PostReaction Model
 * Represents reactions (likes) on posts
 */
const PostReaction = sequelize.define('PostReaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'post_id',
    references: {
      model: 'posts',
      key: 'id'
    },
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'Post ID is required'
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
  reactionType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'like',
    field: 'reaction_type',
    validate: {
      isIn: {
        args: [['like', 'love', 'helpful', 'insightful']],
        msg: 'Invalid reaction type'
      }
    }
  }
}, {
  tableName: 'post_reactions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['post_id', 'user_id', 'reaction_type'],
      name: 'unique_post_user_reaction'
    },
    {
      fields: ['post_id']
    },
    {
      fields: ['user_id']
    }
  ]
});

module.exports = PostReaction;
