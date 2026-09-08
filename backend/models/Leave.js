const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Leave = sequelize.define('Leave', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  leave_type: {
    type: DataTypes.ENUM(
      'casual_leave', 'sick_leave', 'earned_leave',
      'maternity_paternity', 'compensatory_off', 'unpaid_leave', 'work_from_home'
    ),
    allowNull: false,
    validate: {
      isIn: [['casual_leave', 'sick_leave', 'earned_leave',
        'maternity_paternity', 'compensatory_off', 'unpaid_leave', 'work_from_home']],
    },
  },
  from_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  to_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  days: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'approved', 'rejected']] },
  },
  approved_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  approver_comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  applied_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'leaves',
  timestamps: true,
  underscored: true,
});

module.exports = Leave;
