'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      reportType: {
        type: Sequelize.ENUM('post', 'thread', 'user'),
        allowNull: false,
        field: 'report_type',
        comment: 'Type of content being reported'
      },
      reportedItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'reported_item_id',
        comment: 'ID of the reported post/thread/user'
      },
      reporterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'reporter_id',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who submitted the report'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Reason for the report'
      },
      status: {
        type: Sequelize.ENUM('pending', 'resolved', 'dismissed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Status of the report'
      },
      resolvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'resolved_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Moderator who resolved the report'
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'resolved_at',
        comment: 'When the report was resolved'
      },
      moderatorNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'moderator_notes',
        comment: 'Internal notes from moderator'
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

    // Add indexes for efficient queries
    await queryInterface.addIndex('reports', ['status'], {
      name: 'reports_status_idx'
    });
    await queryInterface.addIndex('reports', ['report_type', 'reported_item_id'], {
      name: 'reports_type_item_idx'
    });
    await queryInterface.addIndex('reports', ['reporter_id'], {
      name: 'reports_reporter_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('reports', 'reports_reporter_idx');
    await queryInterface.removeIndex('reports', 'reports_type_item_idx');
    await queryInterface.removeIndex('reports', 'reports_status_idx');
    await queryInterface.dropTable('reports');
    
    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_report_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_status";');
  }
};
