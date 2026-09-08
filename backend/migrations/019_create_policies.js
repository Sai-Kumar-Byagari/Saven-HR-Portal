'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('policies', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      category: { type: Sequelize.ENUM('Leave Policy', 'Code of Conduct', 'IT Policy', 'HR Policy', 'Finance Policy', 'Travel Policy', 'Other'), defaultValue: 'Other' },
      file_path: { type: Sequelize.STRING(500), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      uploaded_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
  },
  async down(queryInterface) { await queryInterface.dropTable('policies'); },
};
