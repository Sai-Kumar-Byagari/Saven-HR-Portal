'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_profiles', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      gender: { type: Sequelize.ENUM('male', 'female', 'other', 'prefer_not_to_say'), allowNull: true },
      dob: { type: Sequelize.DATEONLY, allowNull: true },
      blood_group: { type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      emergency_contact: { type: Sequelize.STRING(20), allowNull: true },
      emergency_contact_name: { type: Sequelize.STRING(100), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      account_number: { type: Sequelize.STRING(50), allowNull: true },
      ifsc_code: { type: Sequelize.STRING(20), allowNull: true },
      bank_name: { type: Sequelize.STRING(100), allowNull: true },
      branch_name: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
  },
  async down(queryInterface) { await queryInterface.dropTable('employee_profiles'); },
};
