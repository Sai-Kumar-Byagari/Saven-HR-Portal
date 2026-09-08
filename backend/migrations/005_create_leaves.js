'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leaves', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      leave_type: { type: Sequelize.ENUM('casual_leave', 'sick_leave', 'earned_leave', 'maternity_paternity', 'compensatory_off', 'unpaid_leave'), allowNull: false },
      from_date: { type: Sequelize.DATEONLY, allowNull: false },
      to_date: { type: Sequelize.DATEONLY, allowNull: false },
      days: { type: Sequelize.DECIMAL(4, 1), allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      approved_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approver_comment: { type: Sequelize.TEXT, allowNull: true },
      applied_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('leaves', ['user_id']);
    await queryInterface.addIndex('leaves', ['status']);
  },
  async down(queryInterface) { await queryInterface.dropTable('leaves'); },
};
