'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('team_members', {
      id:        { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      team_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'teams', key: 'id' }, onDelete: 'CASCADE' },
      user_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      tech_role: { type: Sequelize.STRING(100), allowNull: true },
      joined_at: { type: Sequelize.DATEONLY, defaultValue: Sequelize.literal('(CURDATE())') },
      created_at:{ type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:{ type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addConstraint('team_members', { fields: ['team_id','user_id'], type: 'unique', name: 'unique_team_user' });
  },
  async down(queryInterface) { await queryInterface.dropTable('team_members'); },
};
