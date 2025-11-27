'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, create the ENUM type explicitly for PostgreSQL
    await queryInterface.sequelize.query(
      `DO $$ BEGIN
        CREATE TYPE enum_users_role AS ENUM ('user', 'moderator', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    );

    // Add role column to users table
    await queryInterface.addColumn('users', 'role', {
      type: 'enum_users_role',
      allowNull: false,
      defaultValue: 'user'
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
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_role;');
  }
};
