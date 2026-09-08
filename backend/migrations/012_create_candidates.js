'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('candidates', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      position_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'job_positions', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(200), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      resume_path: { type: Sequelize.STRING(500), allowNull: true },
      resume_text: { type: Sequelize.TEXT('long'), allowNull: true },
      ai_score: { type: Sequelize.INTEGER, allowNull: true },
      ai_strengths: { type: Sequelize.TEXT, allowNull: true },
      ai_gaps: { type: Sequelize.TEXT, allowNull: true },
      ai_recommendation: { type: Sequelize.TEXT, allowNull: true },
      ai_status: { type: Sequelize.ENUM('pending', 'evaluated', 'failed'), defaultValue: 'pending' },
      status: { type: Sequelize.ENUM('new', 'shortlisted', 'rejected', 'hired', 'in_progress'), defaultValue: 'new' },
      referred_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('candidates', ['position_id']);
    await queryInterface.addIndex('candidates', ['status']);
  },
  async down(queryInterface) { await queryInterface.dropTable('candidates'); },
};
