'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payroll', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      month: { type: Sequelize.INTEGER, allowNull: false },
      year: { type: Sequelize.INTEGER, allowNull: false },
      basic: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      hra: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      allowances: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      pf_deduction: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      professional_tax: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      tds: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      other_deductions: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      net_pay: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      slip_path: { type: Sequelize.STRING(500), allowNull: true },
      generated_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addConstraint('payroll', { fields: ['user_id', 'month', 'year'], type: 'unique', name: 'unique_user_month_year_payroll' });
    await queryInterface.addIndex('payroll', ['user_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('payroll'); },
};
