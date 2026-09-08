'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teams', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name:        { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      manager_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      color:       { type: Sequelize.STRING(20), defaultValue: '#2563EB' },
      created_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('teams', ['manager_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('teams'); },
};
