const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reportType: {
    type: DataTypes.ENUM('post', 'thread', 'user'),
    allowNull: false,
    field: 'report_type',
    comment: 'Type of content being reported'
  },
  reportedItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reported_item_id',
    comment: 'ID of the reported post/thread/user'
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reporter_id',
    comment: 'User who submitted the report'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Reason for the report'
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Status of the report'
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'resolved_by',
    comment: 'Moderator who resolved the report'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at',
    comment: 'When the report was resolved'
  },
  moderatorNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'moderator_notes',
    comment: 'Internal notes from moderator'
  }
}, {
  tableName: 'reports',
  timestamps: true,
  underscored: true
});

module.exports = Report;
