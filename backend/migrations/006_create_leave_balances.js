'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_balances', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      financial_year: { type: Sequelize.STRING(10), allowNull: false },
      total_leaves: { type: Sequelize.INTEGER, defaultValue: 18 },
      used_leaves: { type: Sequelize.DECIMAL(4, 1), defaultValue: 0 },
      current_month_used: { type: Sequelize.DECIMAL(4, 1), defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addConstraint('leave_balances', { fields: ['user_id', 'financial_year'], type: 'unique', name: 'unique_user_fy_balance' });
  },
  async down(queryInterface) { await queryInterface.dropTable('leave_balances'); },
};
