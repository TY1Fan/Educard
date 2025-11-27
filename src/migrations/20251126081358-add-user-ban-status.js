'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add is_banned column to users table
    await queryInterface.addColumn('users', 'is_banned', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the user is banned from the platform'
    });

    // Add banned_at column to track when user was banned
    await queryInterface.addColumn('users', 'banned_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when user was banned'
    });

    // Add banned_by column to track which admin banned the user
    await queryInterface.addColumn('users', 'banned_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Admin user ID who banned this user'
    });

    // Add ban_reason column for moderation transparency
    await queryInterface.addColumn('users', 'ban_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Reason for banning the user'
    });

    // Add index for banned status queries
    await queryInterface.addIndex('users', ['is_banned'], {
      name: 'users_is_banned_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('users', 'users_is_banned_idx');

    // Remove columns in reverse order
    await queryInterface.removeColumn('users', 'ban_reason');
    await queryInterface.removeColumn('users', 'banned_by');
    await queryInterface.removeColumn('users', 'banned_at');
    await queryInterface.removeColumn('users', 'is_banned');
  }
};
