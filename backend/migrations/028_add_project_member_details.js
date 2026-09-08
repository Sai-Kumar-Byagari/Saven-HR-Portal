'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add responsibilities and deadline columns to team_members
    await queryInterface.addColumn('team_members', 'responsibilities', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'tech_role',
    });
    await queryInterface.addColumn('team_members', 'member_deadline', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'responsibilities',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('team_members', 'responsibilities');
    await queryInterface.removeColumn('team_members', 'member_deadline');
  },
};
