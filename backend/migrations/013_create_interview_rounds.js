'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interview_rounds', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      candidate_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'candidates', key: 'id' }, onDelete: 'CASCADE' },
      round_number: { type: Sequelize.INTEGER, allowNull: false },
      round_type: { type: Sequelize.ENUM('phone', 'technical', 'hr'), allowNull: false },
      recording_path: { type: Sequelize.STRING(500), allowNull: true },
      ai_feedback: { type: Sequelize.TEXT('long'), allowNull: true },
      ai_score: { type: Sequelize.INTEGER, allowNull: true },
      ai_status: { type: Sequelize.ENUM('pending', 'evaluated', 'failed'), defaultValue: 'pending' },
      status: { type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'), defaultValue: 'scheduled' },
      conducted_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      final_decision: { type: Sequelize.ENUM('selected', 'rejected', 'hold', 'pending'), defaultValue: 'pending' },
      decision_comment: { type: Sequelize.TEXT, allowNull: true },
      scheduled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('interview_rounds', ['candidate_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('interview_rounds'); },
};
