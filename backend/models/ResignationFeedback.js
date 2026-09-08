const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ResignationFeedback = sequelize.define('ResignationFeedback', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  resignation_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true,
    references: { model: 'resignation_forms', key: 'id' },
  },
  feedback_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  reason_for_leaving: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  suggestions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  would_rejoin: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'resignation_feedback',
  timestamps: true,
  underscored: true,
});

module.exports = ResignationFeedback;
