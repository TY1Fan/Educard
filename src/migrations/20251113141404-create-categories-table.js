'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
        field: 'slug'
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'display_order'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('categories', ['slug'], {
      name: 'idx_categories_slug',
      unique: true
    });

    await queryInterface.addIndex('categories', ['display_order'], {
      name: 'idx_categories_display_order'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
  }
};
