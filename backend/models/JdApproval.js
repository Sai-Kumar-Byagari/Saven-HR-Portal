const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JdApproval = sequelize.define('JdApproval', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  position_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'job_positions', key: 'id' } },
  manager_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  status:      { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  comment:     { type: DataTypes.TEXT, allowNull: true },
  min_score:   { type: DataTypes.INTEGER, allowNull: true },
  decided_at:  { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'jd_approvals', timestamps: true, underscored: true });

module.exports = JdApproval;
