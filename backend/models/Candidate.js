const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  position_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'job_positions', key: 'id' },
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    // No Sequelize-level email validation — controller sanitizes before save
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  resume_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  resume_text: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  ai_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0, max: 100 },
  },
  ai_strengths: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ai_gaps: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ai_recommendation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ai_status: {
    type: DataTypes.ENUM('pending', 'evaluated', 'failed'),
    defaultValue: 'pending',
  },
  status: {
    type: DataTypes.ENUM('new', 'shortlisted', 'rejected', 'hired', 'in_progress'),
    defaultValue: 'new',
    validate: { isIn: [['new', 'shortlisted', 'rejected', 'hired', 'in_progress']] },
  },
  referred_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'candidates',
  timestamps: true,
  underscored: true,
});

module.exports = Candidate;
