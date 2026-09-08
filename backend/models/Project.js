const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name:        { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  team_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'teams', key: 'id' } },
  manager_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  status:      { type: DataTypes.ENUM('planning','active','on_hold','completed'), defaultValue: 'active',
                 validate: { isIn: [['planning','active','on_hold','completed']] } },
  start_date:  { type: DataTypes.DATEONLY, allowNull: true },
  end_date:    { type: DataTypes.DATEONLY, allowNull: true },
  tech_stack:  { type: DataTypes.STRING(500), allowNull: true, comment: 'comma-separated tech stack' },
}, { tableName: 'projects', timestamps: true, underscored: true });

module.exports = Project;
