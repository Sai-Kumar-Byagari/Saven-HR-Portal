const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id:               { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  team_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'teams', key: 'id' } },
  user_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  tech_role:        { type: DataTypes.STRING(100), allowNull: true, comment: 'e.g. Flutter Dev, Backend Dev, QA' },
  responsibilities: { type: DataTypes.TEXT, allowNull: true, comment: 'What this member is responsible for in their projects' },
  member_deadline:  { type: DataTypes.DATEONLY, allowNull: true, comment: 'Personal deadline for this member' },
  joined_at:        { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
}, { tableName: 'team_members', timestamps: true, underscored: true,
  indexes: [{ unique: true, fields: ['team_id', 'user_id'] }] });

module.exports = TeamMember;
