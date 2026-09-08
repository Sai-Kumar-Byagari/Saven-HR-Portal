'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resignation_feedback', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      resignation_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'resignation_forms', key: 'id' }, onDelete: 'CASCADE' },
      feedback_text: { type: Sequelize.TEXT, allowNull: false },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      reason_for_leaving: { type: Sequelize.STRING(500), allowNull: true },
      suggestions: { type: Sequelize.TEXT, allowNull: true },
      would_rejoin: { type: Sequelize.BOOLEAN, allowNull: true },
      submitted_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
  },
  async down(queryInterface) { await queryInterface.dropTable('resignation_feedback'); },
};
