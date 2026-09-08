const cron = require('node-cron');
const { User, EmployeeProfile } = require('../models');
const { createNotification, createBulkNotifications } = require('../services/notification.service');
const { Sequelize } = require('sequelize');

/**
 * Gets today's MM-DD in IST to correctly match birthdays.
 */
function getTodayMMDD() {
  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
  const [, mm, dd] = dateStr.split('-');
  return `${mm}-${dd}`; // e.g. "06-22"
}

async function runBirthdayWisher() {
  try {
    const mmdd = getTodayMMDD();

    // Find employees whose birthday is today (match MM-DD part of dob)
    const birthdayEmployees = await EmployeeProfile.findAll({
      where: Sequelize.where(
        Sequelize.fn('DATE_FORMAT', Sequelize.col('dob'), '%m-%d'),
        mmdd
      ),
      include: [{
        model: User,
        as: 'user',
        where: { is_active: true },
        attributes: ['id', 'first_name', 'last_name'],
      }],
    });

    if (birthdayEmployees.length === 0) {
      console.log(`[BirthdayWisher] No birthdays today (${mmdd}).`);
      return { count: 0, date: mmdd };
    }

    const allUsers = await User.findAll({ where: { is_active: true }, attributes: ['id'] });
    const allUserIds = allUsers.map(u => u.id);

    for (const profile of birthdayEmployees) {
      const employee = profile.user;

      // Wish the birthday person
      await createNotification({
        userId: employee.id,
        title: '🎂 Happy Birthday!',
        message: `Happy Birthday, ${employee.first_name}! 🎉 Warm wishes from the entire Saven family! Have a wonderful day!`,
        type: 'birthday',
        navigateTo: '/dashboard',
      });

      // Notify all other employees to wish them
      const otherIds = allUserIds.filter(id => id !== employee.id);
      if (otherIds.length > 0) {
        await createBulkNotifications(otherIds, {
          title: '🎂 Birthday Today!',
          message: `Today is ${employee.first_name} ${employee.last_name}'s birthday! Send them your wishes! 🎉`,
          type: 'birthday',
          navigateTo: '/directory',
        });
      }

      console.log(`[BirthdayWisher] Birthday wishes sent for: ${employee.first_name} ${employee.last_name}`);
    }

    return { count: birthdayEmployees.length, date: mmdd };
  } catch (err) {
    console.error('[BirthdayWisher] Failed:', err.message);
    return { count: 0, error: err.message };
  }
}

// Runs every day at 8:00 AM IST (2:30 AM UTC)
function startBirthdayWisherJob() {
  cron.schedule('30 2 * * *', async () => {
    await runBirthdayWisher();
  }, { timezone: 'Asia/Kolkata' });

  console.log('[BirthdayWisher] Cron job scheduled — runs daily at 8:00 AM IST.');
}

module.exports = { startBirthdayWisherJob, runBirthdayWisher };
