'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add isHidden column to posts table
    await queryInterface.addColumn('posts', 'is_hidden', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the post is hidden by moderators'
    });

    // Add hiddenBy column to track which moderator hid the post
    await queryInterface.addColumn('posts', 'hidden_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Moderator who hid this post'
    });

    // Add hiddenAt column
    await queryInterface.addColumn('posts', 'hidden_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the post was hidden'
    });

    // Add hiddenReason column
    await queryInterface.addColumn('posts', 'hidden_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Reason for hiding the post'
    });

    // Add index for hidden posts queries
    await queryInterface.addIndex('posts', ['is_hidden'], {
      name: 'posts_is_hidden_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('posts', 'posts_is_hidden_idx');
    await queryInterface.removeColumn('posts', 'hidden_reason');
    await queryInterface.removeColumn('posts', 'hidden_at');
    await queryInterface.removeColumn('posts', 'hidden_by');
    await queryInterface.removeColumn('posts', 'is_hidden');
  }
};
