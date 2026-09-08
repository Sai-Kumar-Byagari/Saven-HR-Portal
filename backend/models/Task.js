const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  project_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'projects', key: 'id' } },
  assigned_to: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  assigned_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  title:       { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  priority:    { type: DataTypes.ENUM('low','medium','high','urgent'), defaultValue: 'medium',
                 validate: { isIn: [['low','medium','high','urgent']] } },
  status:      { type: DataTypes.ENUM('todo','in_progress','review','done'), defaultValue: 'todo',
                 validate: { isIn: [['todo','in_progress','review','done']] } },
  due_date:    { type: DataTypes.DATEONLY, allowNull: true },
  completed_at:{ type: DataTypes.DATE, allowNull: true },
}, { tableName: 'tasks', timestamps: true, underscored: true });

module.exports = Task;
