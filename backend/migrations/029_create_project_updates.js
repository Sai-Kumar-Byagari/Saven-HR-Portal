'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_updates', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      user_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      message:    { type: Sequelize.TEXT, allowNull: false },
      progress_pct: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true, comment: '0-100 overall progress' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('project_updates', ['project_id']);
    await queryInterface.addIndex('project_updates', ['user_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('project_updates'); },
};
