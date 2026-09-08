'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('otp_tokens', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      personal_email: { type: Sequelize.STRING(255), allowNull: false },
      otp_hash: { type: Sequelize.STRING(255), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      is_used: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('otp_tokens', ['personal_email']);
  },
  async down(queryInterface) { await queryInterface.dropTable('otp_tokens'); },
};
