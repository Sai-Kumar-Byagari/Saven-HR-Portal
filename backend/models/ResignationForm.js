const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ResignationForm = sequelize.define('ResignationForm', {
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
  last_working_day: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  notice_period_acknowledgment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('submitted', 'acknowledged', 'accepted', 'rejected'),
    defaultValue: 'submitted',
    validate: { isIn: [['submitted', 'acknowledged', 'accepted', 'rejected']] },
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'resignation_forms',
  timestamps: true,
  underscored: true,
});

module.exports = ResignationForm;
