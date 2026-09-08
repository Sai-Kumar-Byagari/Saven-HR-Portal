'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_voice', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('appreciation', 'suggestion', 'grievance', 'other'), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      is_anonymous: { type: Sequelize.BOOLEAN, defaultValue: false },
      status: { type: Sequelize.ENUM('open', 'acknowledged', 'resolved'), defaultValue: 'open' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
  },
  async down(queryInterface) { await queryInterface.dropTable('employee_voice'); },
};
