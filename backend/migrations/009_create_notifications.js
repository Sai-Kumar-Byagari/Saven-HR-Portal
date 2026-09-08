'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING(255), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.ENUM('leave', 'attendance', 'recruitment', 'interview', 'voice', 'payroll', 'resignation', 'policy', 'onboarding', 'birthday', 'festival', 'system', 'general'), defaultValue: 'general' },
      reference_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      reference_type: { type: Sequelize.STRING(50), allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      navigate_to: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['is_read']);
  },
  async down(queryInterface) { await queryInterface.dropTable('notifications'); },
};
