'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holiday_calendar', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      name: { type: Sequelize.STRING(200), allowNull: false },
      type: { type: Sequelize.ENUM('national', 'festival', 'optional'), defaultValue: 'festival' },
      created_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('holiday_calendar', ['date']);
  },
  async down(queryInterface) { await queryInterface.dropTable('holiday_calendar'); },
};
