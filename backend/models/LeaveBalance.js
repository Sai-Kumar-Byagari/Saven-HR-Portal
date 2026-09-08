const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LeaveBalance = sequelize.define('LeaveBalance', {
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
  financial_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'e.g. 2024-25',
  },
  total_leaves: {
    type: DataTypes.INTEGER,
    defaultValue: 18,
  },
  used_leaves: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 0,
    validate: { min: 0 },
  },
  current_month_used: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 0,
    validate: { min: 0 },
  },
}, {
  tableName: 'leave_balances',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'financial_year'],
    },
  ],
});

module.exports = LeaveBalance;
