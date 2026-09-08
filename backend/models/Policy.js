const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Policy = sequelize.define('Policy', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'Leave Policy', 'Code of Conduct', 'IT Policy',
      'HR Policy', 'Finance Policy', 'Travel Policy', 'Other'
    ),
    defaultValue: 'Other',
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  uploaded_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'policies',
  timestamps: true,
  paranoid: true,
  underscored: true,
});

module.exports = Policy;
