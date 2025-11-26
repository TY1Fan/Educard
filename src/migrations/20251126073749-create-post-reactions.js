'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('post_reactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reaction_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'like'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate reactions
    await queryInterface.addIndex('post_reactions', ['post_id', 'user_id', 'reaction_type'], {
      unique: true,
      name: 'unique_post_user_reaction'
    });

    // Add indexes for performance
    await queryInterface.addIndex('post_reactions', ['post_id'], {
      name: 'post_reactions_post_id_idx'
    });

    await queryInterface.addIndex('post_reactions', ['user_id'], {
      name: 'post_reactions_user_id_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('post_reactions');
  }
};
