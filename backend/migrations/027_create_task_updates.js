'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_updates', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      task_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'tasks', key: 'id' }, onDelete: 'CASCADE' },
      user_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      message:    { type: Sequelize.TEXT, allowNull: false },
      old_status: { type: Sequelize.STRING(30), allowNull: true },
      new_status: { type: Sequelize.STRING(30), allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('task_updates', ['task_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('task_updates'); },
};
