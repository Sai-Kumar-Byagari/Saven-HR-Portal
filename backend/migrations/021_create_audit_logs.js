'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      action: { type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UPLOAD'), allowNull: false },
      table_name: { type: Sequelize.STRING(100), allowNull: false },
      record_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      old_value: { type: Sequelize.JSON, allowNull: true },
      new_value: { type: Sequelize.JSON, allowNull: true },
      ip_address: { type: Sequelize.STRING(50), allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['table_name']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
  },
  async down(queryInterface) { await queryInterface.dropTable('audit_logs'); },
};
