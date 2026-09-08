const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProjectMessage = sequelize.define('ProjectMessage', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  project_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'projects', key: 'id' } },
  sender_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  // null = broadcast to whole team; set = to specific member
  target_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' } },
  // null = root message; set = reply
  parent_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'project_messages', key: 'id' } },
  message:        { type: DataTypes.TEXT, allowNull: false },
  type:           { type: DataTypes.ENUM('announcement', 'query', 'reply'), defaultValue: 'announcement',
                    validate: { isIn: [['announcement', 'query', 'reply']] } },
}, { tableName: 'project_messages', timestamps: true, underscored: true });

module.exports = ProjectMessage;
