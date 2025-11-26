'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add isBanned column to users table
    await queryInterface.addColumn('users', 'isBanned', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the user is banned from the platform'
    });

    // Add bannedAt column to track when user was banned
    await queryInterface.addColumn('users', 'bannedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when user was banned'
    });

    // Add bannedBy column to track which admin banned the user
    await queryInterface.addColumn('users', 'bannedBy', {
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

    // Add banReason column for moderation transparency
    await queryInterface.addColumn('users', 'banReason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Reason for banning the user'
    });

    // Add index for banned status queries
    await queryInterface.addIndex('users', ['isBanned'], {
      name: 'users_is_banned_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('users', 'users_is_banned_idx');

    // Remove columns in reverse order
    await queryInterface.removeColumn('users', 'banReason');
    await queryInterface.removeColumn('users', 'bannedBy');
    await queryInterface.removeColumn('users', 'bannedAt');
    await queryInterface.removeColumn('users', 'isBanned');
  }
};
