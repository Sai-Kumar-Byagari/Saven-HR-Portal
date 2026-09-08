const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  emp_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    comment: 'Unique employee ID e.g. SAV001',
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  },
  work_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  personal_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'manager', 'hr', 'employee', 'it', 'payroll'),
    allowNull: false,
    defaultValue: 'employee',
    validate: {
      isIn: [['super_admin', 'manager', 'hr', 'employee', 'it', 'payroll']],
    },
  },
  is_first_login: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  employee_type: {
    type: DataTypes.ENUM('new', 'existing'),
    defaultValue: 'new',
  },
  onboarding_complete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  doj: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  reporting_manager_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  office_location: {
    type: DataTypes.STRING(100),
    defaultValue: 'Hyderabad',
  },
  profile_photo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  refresh_token_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true,
});

module.exports = User;
