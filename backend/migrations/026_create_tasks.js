'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      project_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      assigned_to:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      assigned_by:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      title:        { type: Sequelize.STRING(300), allowNull: false },
      description:  { type: Sequelize.TEXT, allowNull: true },
      priority:     { type: Sequelize.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
      status:       { type: Sequelize.ENUM('todo','in_progress','review','done'), defaultValue: 'todo' },
      due_date:     { type: Sequelize.DATEONLY, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at:   { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:   { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('tasks', ['assigned_to']);
    await queryInterface.addIndex('tasks', ['project_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('tasks'); },
};
