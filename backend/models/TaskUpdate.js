const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskUpdate = sequelize.define('TaskUpdate', {
  id:        { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  task_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'tasks', key: 'id' } },
  user_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  message:   { type: DataTypes.TEXT, allowNull: false },
  old_status:{ type: DataTypes.STRING(30), allowNull: true },
  new_status:{ type: DataTypes.STRING(30), allowNull: true },
}, { tableName: 'task_updates', timestamps: true, updatedAt: false, underscored: true });

module.exports = TaskUpdate;
