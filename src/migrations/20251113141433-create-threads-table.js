'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('threads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'category_id',
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'slug'
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_pinned'
      },
      isLocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_locked'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('threads', ['category_id', 'slug'], {
      name: 'idx_threads_category_slug',
      unique: true
    });

    await queryInterface.addIndex('threads', ['category_id'], {
      name: 'idx_threads_category_id'
    });

    await queryInterface.addIndex('threads', ['user_id'], {
      name: 'idx_threads_user_id'
    });

    await queryInterface.addIndex('threads', ['updated_at'], {
      name: 'idx_threads_updated_at'
    });

    await queryInterface.addIndex('threads', ['is_pinned'], {
      name: 'idx_threads_is_pinned'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('threads');
  }
};
