'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name:        { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      team_id:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'teams', key: 'id' }, onDelete: 'CASCADE' },
      manager_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      status:      { type: Sequelize.ENUM('planning','active','on_hold','completed'), defaultValue: 'active' },
      start_date:  { type: Sequelize.DATEONLY, allowNull: true },
      end_date:    { type: Sequelize.DATEONLY, allowNull: true },
      tech_stack:  { type: Sequelize.STRING(500), allowNull: true },
      created_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('projects', ['team_id']);
    await queryInterface.addIndex('projects', ['manager_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('projects'); },
};
