const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrgChart = sequelize.define('OrgChart', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true,
    references: { model: 'users', key: 'id' },
  },
  manager_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  designation: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'org_chart',
  timestamps: true,
  underscored: true,
});

module.exports = OrgChart;
