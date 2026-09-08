const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobPosition = sequelize.define('JobPosition', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  created_by_hr: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  assigned_manager_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  approved_by_manager: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'open', 'closed'),
    defaultValue: 'draft',
    validate: { isIn: [['draft', 'pending_approval', 'open', 'closed']] },
  },
  key_responsibilities: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  required_skills: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  experience_years: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  salary_lpa: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g. "8-12 LPA" or "15 LPA"',
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Application deadline',
  },
  min_score: {
    type: DataTypes.INTEGER,
    defaultValue: 70,
    validate: { min: 0, max: 100 },
  },
  rejection_comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'job_positions',
  timestamps: true,
  paranoid: true,
  underscored: true,
});

module.exports = JobPosition;
