const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HolidayCalendar = sequelize.define('HolidayCalendar', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('national', 'festival', 'optional'),
    defaultValue: 'festival',
    validate: { isIn: [['national', 'festival', 'optional']] },
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
}, {
  tableName: 'holiday_calendar',
  timestamps: true,
  underscored: true,
});

module.exports = HolidayCalendar;
