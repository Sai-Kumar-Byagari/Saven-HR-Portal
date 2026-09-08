const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'leave', 'attendance', 'recruitment', 'interview', 'voice',
      'payroll', 'resignation', 'policy', 'onboarding', 'birthday',
      'festival', 'system', 'general'
    ),
    defaultValue: 'general',
  },
  reference_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  navigate_to: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
});

module.exports = Notification;
