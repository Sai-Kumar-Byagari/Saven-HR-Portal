const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payroll = sequelize.define('Payroll', {
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
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 12 },
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  basic: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  hra: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  allowances: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  pf_deduction: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  professional_tax: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  tds: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  other_deductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  net_pay: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  slip_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  generated_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'payroll',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'month', 'year'],
    },
  ],
});

module.exports = Payroll;
