'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('onboarding_tasks', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      task_name: { type: Sequelize.STRING(255), allowNull: false },
      task_key: { type: Sequelize.STRING(100), allowNull: true },
      is_completed: { type: Sequelize.BOOLEAN, defaultValue: false },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      order_index: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('onboarding_tasks', ['user_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('onboarding_tasks'); },
};
