'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_documents', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      doc_type: { type: Sequelize.ENUM('ssc', '12th', 'degree', 'aadhar', 'pan', 'resume', 'offer_letter', 'other'), allowNull: false },
      file_path: { type: Sequelize.STRING(500), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      display_name: { type: Sequelize.STRING(255), allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: true },
      file_size: { type: Sequelize.INTEGER, allowNull: true },
      uploaded_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('employee_documents', ['user_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('employee_documents'); },
};
