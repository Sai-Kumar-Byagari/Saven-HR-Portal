const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmployeeProfile = sequelize.define('EmployeeProfile', {
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
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true,
    validate: { isIn: [['male', 'female', 'other', 'prefer_not_to_say']] },
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  blood_group: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  emergency_contact: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  emergency_contact_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  account_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ifsc_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  bank_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  branch_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'employee_profiles',
  timestamps: true,
  underscored: true,
});

module.exports = EmployeeProfile;
