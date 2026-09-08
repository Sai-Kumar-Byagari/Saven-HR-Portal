'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as cnt FROM holiday_calendar',
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (existing[0].cnt > 0) {
      console.log('[Seeder] Holidays already seeded. Skipping.');
      return;
    }

    const now = new Date();
    const holidays = [
      { date: '2025-01-14', name: 'Makar Sankranti', type: 'festival' },
      { date: '2025-01-26', name: 'Republic Day', type: 'national' },
      { date: '2025-03-14', name: 'Holi', type: 'festival' },
      { date: '2025-04-10', name: 'Ugadi', type: 'festival' },
      { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'national' },
      { date: '2025-04-18', name: 'Good Friday', type: 'festival' },
      { date: '2025-05-01', name: 'Labour Day', type: 'national' },
      { date: '2025-06-07', name: 'Eid ul-Adha', type: 'festival' },
      { date: '2025-08-15', name: 'Independence Day', type: 'national' },
      { date: '2025-08-27', name: 'Ganesh Chaturthi', type: 'festival' },
      { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'national' },
      { date: '2025-10-02', name: 'Dussehra', type: 'festival' },
      { date: '2025-10-20', name: 'Diwali', type: 'festival' },
      { date: '2025-10-21', name: 'Diwali (Day 2)', type: 'festival' },
      { date: '2025-11-05', name: 'Guru Nanak Jayanti', type: 'festival' },
      { date: '2025-12-25', name: 'Christmas', type: 'festival' },
      { date: '2025-12-31', name: 'New Year Eve', type: 'optional' },
      { date: '2026-01-01', name: 'New Year Day', type: 'national' },
    ];

    await queryInterface.bulkInsert('holiday_calendar',
      holidays.map((h) => ({ ...h, created_at: now, updated_at: now }))
    );

    console.log('[Seeder] Holiday calendar seeded with 18 holidays.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('holiday_calendar', null, {});
  },
};
