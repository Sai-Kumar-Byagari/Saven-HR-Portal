'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'emp_id', {
      type: Sequelize.STRING(50),
      allowNull: true, // allow null temporarily for existing rows
      unique: true,
      after: 'id',
      comment: 'Unique employee ID e.g. SAV001',
    });
    await queryInterface.addIndex('users', ['emp_id'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'emp_id');
  },
};
