'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resignation_forms', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      last_working_day: { type: Sequelize.DATEONLY, allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: false },
      notice_period_acknowledgment: { type: Sequelize.BOOLEAN, defaultValue: false },
      status: { type: Sequelize.ENUM('submitted', 'acknowledged', 'accepted', 'rejected'), defaultValue: 'submitted' },
      submitted_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
  },
  async down(queryInterface) { await queryInterface.dropTable('resignation_forms'); },
};
