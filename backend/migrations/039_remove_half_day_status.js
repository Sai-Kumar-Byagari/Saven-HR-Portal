'use strict';

module.exports = {
  async up(queryInterface) {
    // Convert any existing half_day records to present
    await queryInterface.sequelize.query(
      `UPDATE attendance SET status = 'present' WHERE status = 'half_day'`
    );
    // Alter ENUM to remove half_day
    await queryInterface.sequelize.query(
      `ALTER TABLE attendance MODIFY COLUMN status ENUM('present', 'absent', 'on_leave') DEFAULT 'present'`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE attendance MODIFY COLUMN status ENUM('present', 'absent', 'half_day', 'on_leave') DEFAULT 'present'`
    );
  },
};
