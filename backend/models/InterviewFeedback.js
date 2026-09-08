const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InterviewFeedback = sequelize.define('InterviewFeedback', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  round_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'interview_rounds', key: 'id' },
  },
  given_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  feedback_text: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0, max: 100 },
  },
  recommendation: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'interview_feedback',
  timestamps: true,
  underscored: true,
});

module.exports = InterviewFeedback;
