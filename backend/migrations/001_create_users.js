'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      first_name: { type: Sequelize.STRING(100), allowNull: false },
      last_name: { type: Sequelize.STRING(100), allowNull: false },
      work_email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      personal_email: { type: Sequelize.STRING(255), allowNull: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('super_admin', 'manager', 'hr', 'employee', 'it', 'payroll'), allowNull: false, defaultValue: 'employee' },
      is_first_login: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      employee_type: { type: Sequelize.ENUM('new', 'existing'), defaultValue: 'new' },
      onboarding_complete: { type: Sequelize.BOOLEAN, defaultValue: false },
      doj: { type: Sequelize.DATEONLY, allowNull: true },
      reporting_manager_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      office_location: { type: Sequelize.STRING(100), defaultValue: 'Hyderabad' },
      profile_photo: { type: Sequelize.STRING(500), allowNull: true },
      created_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      refresh_token_hash: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });

    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['reporting_manager_id']);
    await queryInterface.addIndex('users', ['is_active']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
