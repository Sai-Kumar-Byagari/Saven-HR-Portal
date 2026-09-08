'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('Admin@1234', 12);
    const now = new Date();

    // Check if admin already exists
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE work_email = :email LIMIT 1',
      { replacements: { email: 'admin@saven.tech' }, type: Sequelize.QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      console.log('[Seeder] Admin user already exists. Skipping.');
      return;
    }

    await queryInterface.bulkInsert('users', [{
      first_name: 'Saven',
      last_name: 'Admin',
      work_email: 'admin@saven.tech',
      personal_email: 'admin.personal@saven.tech',
      password_hash: passwordHash,
      role: 'super_admin',
      is_first_login: false,
      is_active: true,
      employee_type: 'existing',
      onboarding_complete: true,
      office_location: 'Hyderabad',
      doj: '2020-01-01',
      created_at: now,
      updated_at: now,
    }]);

    // Get admin user id
    const [admin] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE work_email = :email LIMIT 1',
      { replacements: { email: 'admin@saven.tech' }, type: Sequelize.QueryTypes.SELECT }
    );

    if (admin) {
      await queryInterface.bulkInsert('employee_profiles', [{
        user_id: admin.id,
        created_at: now,
        updated_at: now,
      }]);
    }

    console.log('[Seeder] Admin user seeded: admin@saven.tech / Admin@1234');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { work_email: 'admin@saven.tech' });
  },
};
