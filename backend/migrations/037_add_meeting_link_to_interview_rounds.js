'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('interview_rounds', 'meeting_link', {
      type: Sequelize.STRING(1000),
      allowNull: true,
      after: 'scheduled_at',
      comment: 'Teams/Zoom/Meet meeting link for this interview round',
    });
    await queryInterface.addColumn('interview_rounds', 'duration_mins', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 60,
      after: 'meeting_link',
      comment: 'Interview duration in minutes',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('interview_rounds', 'meeting_link');
    await queryInterface.removeColumn('interview_rounds', 'duration_mins');
  },
};
