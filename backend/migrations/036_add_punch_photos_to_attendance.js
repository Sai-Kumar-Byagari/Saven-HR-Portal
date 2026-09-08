'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attendance', 'punch_in_photo', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'clock_in',
      comment: 'Photo taken at punch-in',
    });
    await queryInterface.addColumn('attendance', 'punch_out_photo', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'clock_out',
      comment: 'Photo taken at punch-out',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('attendance', 'punch_in_photo');
    await queryInterface.removeColumn('attendance', 'punch_out_photo');
  },
};
