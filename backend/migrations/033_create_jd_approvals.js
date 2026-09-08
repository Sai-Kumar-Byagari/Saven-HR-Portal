'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jd_approvals', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      position_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'job_positions', key: 'id' }, onDelete: 'CASCADE' },
      manager_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      status:      { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      comment:     { type: Sequelize.TEXT, allowNull: true },
      min_score:   { type: Sequelize.INTEGER, allowNull: true, comment: 'Manager-set minimum score for shortlisting' },
      decided_at:  { type: Sequelize.DATE, allowNull: true },
      created_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('jd_approvals', ['position_id']);
    await queryInterface.addIndex('jd_approvals', ['manager_id']);
    await queryInterface.addIndex('jd_approvals', ['position_id', 'manager_id'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('jd_approvals'); },
};
