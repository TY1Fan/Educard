'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      threadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'thread_id',
        references: {
          model: 'threads',
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
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      isFirstPost: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_first_post'
      },
      editedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'edited_at'
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
    await queryInterface.addIndex('posts', ['thread_id'], {
      name: 'idx_posts_thread_id'
    });

    await queryInterface.addIndex('posts', ['user_id'], {
      name: 'idx_posts_user_id'
    });

    await queryInterface.addIndex('posts', ['created_at'], {
      name: 'idx_posts_created_at'
    });

    await queryInterface.addIndex('posts', ['thread_id', 'created_at'], {
      name: 'idx_posts_thread_created'
    });

    await queryInterface.addIndex('posts', ['is_first_post'], {
      name: 'idx_posts_is_first'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
  }
};
