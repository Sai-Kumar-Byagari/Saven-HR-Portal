const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  clock_in: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  punch_in_photo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  clock_out: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  punch_out_photo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  duration_mins: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'on_leave'),
    defaultValue: 'present',
    validate: { isIn: [['present', 'absent', 'on_leave']] },
  },
}, {
  tableName: 'attendance',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'date'],
    },
  ],
});

module.exports = Attendance;
