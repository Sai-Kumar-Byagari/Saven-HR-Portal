const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OnboardingTask = sequelize.define('OnboardingTask', {
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
  task_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  task_key: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  order_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'onboarding_tasks',
  timestamps: true,
  underscored: true,
});

module.exports = OnboardingTask;
