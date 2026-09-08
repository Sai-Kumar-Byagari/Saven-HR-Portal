const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobDescription = sequelize.define('JobDescription', {
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
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  ai_status: {
    type: DataTypes.ENUM('pending', 'generated', 'failed'),
    defaultValue: 'pending',
  },
  raw_ai_response: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
}, {
  tableName: 'job_descriptions',
  timestamps: true,
  underscored: true,
});

module.exports = JobDescription;
