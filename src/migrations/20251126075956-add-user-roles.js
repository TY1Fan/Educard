'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add role column to users table
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'moderator', 'admin'),
      allowNull: false,
      defaultValue: 'user',
      comment: 'User role: user (default), moderator, or admin'
    });

    // Add index for role column for faster queries
    await queryInterface.addIndex('users', ['role'], {
      name: 'users_role_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('users', 'users_role_idx');
    
    // Remove role column
    await queryInterface.removeColumn('users', 'role');
    
    // Drop the ENUM type (PostgreSQL specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  }
};
