'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      clock_in: { type: Sequelize.TIME, allowNull: true },
      clock_out: { type: Sequelize.TIME, allowNull: true },
      duration_mins: { type: Sequelize.INTEGER, allowNull: true },
      status: { type: Sequelize.ENUM('present', 'absent', 'half_day', 'on_leave'), defaultValue: 'present' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addConstraint('attendance', { fields: ['user_id', 'date'], type: 'unique', name: 'unique_user_date_attendance' });
    await queryInterface.addIndex('attendance', ['user_id']);
    await queryInterface.addIndex('attendance', ['date']);
  },
  async down(queryInterface) { await queryInterface.dropTable('attendance'); },
};
