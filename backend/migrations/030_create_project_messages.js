'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_messages', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      project_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      sender_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      // null = to whole team; set = to specific member
      target_user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' } },
      // null = root message from manager; set = a reply to a root message
      parent_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'project_messages', key: 'id' } },
      message:      { type: Sequelize.TEXT, allowNull: false },
      type:         { type: Sequelize.ENUM('announcement','query','reply'), defaultValue: 'announcement' },
      created_at:   { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:   { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('project_messages', ['project_id']);
    await queryInterface.addIndex('project_messages', ['sender_id']);
    await queryInterface.addIndex('project_messages', ['target_user_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('project_messages'); },
};
