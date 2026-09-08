'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_positions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      department: { type: Sequelize.STRING(100), allowNull: false },
      created_by_hr: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      assigned_manager_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_by_manager: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      status: { type: Sequelize.ENUM('draft', 'pending_approval', 'open', 'closed'), defaultValue: 'draft' },
      key_responsibilities: { type: Sequelize.TEXT, allowNull: true },
      required_skills: { type: Sequelize.TEXT, allowNull: true },
      experience_years: { type: Sequelize.STRING(50), allowNull: true },
      min_score: { type: Sequelize.INTEGER, defaultValue: 70 },
      rejection_comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('job_positions', ['status']);
  },
  async down(queryInterface) { await queryInterface.dropTable('job_positions'); },
};
