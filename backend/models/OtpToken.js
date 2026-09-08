const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OtpToken = sequelize.define('OtpToken', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  personal_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { isEmail: true },
  },
  otp_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'otp_tokens',
  timestamps: true,
  updatedAt: false,
  underscored: true,
});

module.exports = OtpToken;
