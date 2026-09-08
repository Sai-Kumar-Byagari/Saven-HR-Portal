const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InterviewRound = sequelize.define('InterviewRound', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  candidate_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'candidates', key: 'id' },
  },
  round_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isIn: [[1, 2, 3]] },
  },
  round_type: {
    type: DataTypes.ENUM('phone', 'technical', 'hr'),
    allowNull: false,
    validate: { isIn: [['phone', 'technical', 'hr']] },
  },
  recording_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  ai_feedback: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  ai_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0, max: 100 },
  },
  ai_status: {
    type: DataTypes.ENUM('pending', 'evaluated', 'failed'),
    defaultValue: 'pending',
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled',
    validate: { isIn: [['scheduled', 'completed', 'cancelled']] },
  },
  conducted_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  final_decision: {
    type: DataTypes.ENUM('selected', 'rejected', 'hold', 'pending'),
    defaultValue: 'pending',
  },
  decision_comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  meeting_link: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: 'Teams/Zoom/Meet meeting link',
  },
  duration_mins: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 60,
    comment: 'Interview duration in minutes',
  },
}, {
  tableName: 'interview_rounds',
  timestamps: true,
  underscored: true,
});

module.exports = InterviewRound;
