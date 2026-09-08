'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('org_chart', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      manager_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      department: { type: Sequelize.STRING(100), allowNull: true },
      designation: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
  },
  async down(queryInterface) { await queryInterface.dropTable('org_chart'); },
};
