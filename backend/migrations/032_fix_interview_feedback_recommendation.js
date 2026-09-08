'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change recommendation from ENUM to VARCHAR(50) so AI responses don't truncate
    await queryInterface.changeColumn('interview_feedback', 'recommendation', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('interview_feedback', 'recommendation', {
      type: Sequelize.ENUM('hire', 'reject', 'hold'),
      allowNull: true,
    });
  },
};
