'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_descriptions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      position_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'job_positions', key: 'id' }, onDelete: 'CASCADE' },
      content: { type: Sequelize.TEXT('long'), allowNull: false },
      version: { type: Sequelize.INTEGER, defaultValue: 1 },
      ai_status: { type: Sequelize.ENUM('pending', 'generated', 'failed'), defaultValue: 'pending' },
      raw_ai_response: { type: Sequelize.TEXT('long'), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
  },
  async down(queryInterface) { await queryInterface.dropTable('job_descriptions'); },
};
