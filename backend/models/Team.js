const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name:        { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  manager_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  color:       { type: DataTypes.STRING(20), defaultValue: '#2563EB' },
}, { tableName: 'teams', timestamps: true, underscored: true });

module.exports = Team;
