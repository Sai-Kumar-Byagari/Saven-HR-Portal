'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interview_feedback', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      round_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'interview_rounds', key: 'id' }, onDelete: 'CASCADE' },
      given_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      feedback_text: { type: Sequelize.TEXT('long'), allowNull: false },
      score: { type: Sequelize.INTEGER, allowNull: true },
      recommendation: { type: Sequelize.ENUM('hire', 'reject', 'hold'), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
  },
  async down(queryInterface) { await queryInterface.dropTable('interview_feedback'); },
};
