'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('leaves', 'leave_type', {
      type: Sequelize.ENUM(
        'casual_leave', 'sick_leave', 'earned_leave',
        'maternity_paternity', 'compensatory_off', 'unpaid_leave', 'work_from_home'
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('leaves', 'leave_type', {
      type: Sequelize.ENUM(
        'casual_leave', 'sick_leave', 'earned_leave',
        'maternity_paternity', 'compensatory_off', 'unpaid_leave'
      ),
      allowNull: false,
    });
  },
};
