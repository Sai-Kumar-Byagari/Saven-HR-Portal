const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmployeeVoice = sequelize.define('EmployeeVoice', {
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
  type: {
    type: DataTypes.ENUM('appreciation', 'suggestion', 'grievance', 'other'),
    allowNull: false,
    validate: { isIn: [['appreciation', 'suggestion', 'grievance', 'other']] },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'acknowledged', 'resolved'),
    defaultValue: 'open',
    validate: { isIn: [['open', 'acknowledged', 'resolved']] },
  },
}, {
  tableName: 'employee_voice',
  timestamps: true,
  underscored: true,
});

module.exports = EmployeeVoice;
