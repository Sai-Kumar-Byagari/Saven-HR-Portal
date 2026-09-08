'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('job_positions', 'salary_lpa', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'experience_years',
      comment: 'e.g. "8-12 LPA" or "15 LPA"',
    });
    await queryInterface.addColumn('job_positions', 'deadline', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'salary_lpa',
      comment: 'Application deadline',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('job_positions', 'salary_lpa');
    await queryInterface.removeColumn('job_positions', 'deadline');
  },
};
