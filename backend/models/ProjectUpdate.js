const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProjectUpdate = sequelize.define('ProjectUpdate', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  project_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'projects', key: 'id' } },
  user_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  message:      { type: DataTypes.TEXT, allowNull: false },
  progress_pct: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, validate: { min: 0, max: 100 } },
}, { tableName: 'project_updates', timestamps: true, updatedAt: false, underscored: true });

module.exports = ProjectUpdate;
