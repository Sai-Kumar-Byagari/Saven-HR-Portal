const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UPLOAD'),
    allowNull: false,
  },
  table_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  record_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  old_value: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  new_value: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false,
  underscored: true,
});

module.exports = AuditLog;
