const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [8, 255]
    }
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'display_name'
  },
  role: {
    type: DataTypes.ENUM('user', 'moderator', 'admin'),
    defaultValue: 'user',
    allowNull: false,
    comment: 'User role: user (default), moderator, or admin'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_banned',
    comment: 'Whether the user is banned from the platform'
  },
  bannedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'banned_at',
    comment: 'Timestamp when user was banned'
  },
  bannedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'banned_by',
    comment: 'Admin user ID who banned this user'
  },
  banReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ban_reason',
    comment: 'Reason for banning the user'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      if (!user.displayName) {
        user.displayName = user.username;
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance methods for role checking
User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

User.prototype.isModerator = function() {
  return this.role === 'moderator' || this.role === 'admin';
};

User.prototype.isUser = function() {
  return this.role === 'user';
};

User.prototype.hasRole = function(role) {
  if (Array.isArray(role)) {
    return role.includes(this.role);
  }
  return this.role === role;
};

module.exports = User;
