const cron = require('node-cron');
const { HolidayCalendar } = require('../models');
const { notifyAllActiveUsers } = require('../services/notification.service');

/**
 * Gets today's date in IST (Asia/Kolkata) as YYYY-MM-DD string.
 * Fixes the UTC/IST date mismatch when cron runs at 1:30 AM UTC.
 */
function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // returns YYYY-MM-DD
}

// Runs every day at 7:00 AM IST (1:30 AM UTC)
function startFestivalWisherJob() {
  cron.schedule('30 1 * * *', async () => {
    try {
      const today = getTodayIST();
      const holiday = await HolidayCalendar.findOne({ where: { date: today } });

      if (!holiday) return;

      await notifyAllActiveUsers({
        title: `🎊 Happy ${holiday.name}!`,
        message: `🎊 Happy ${holiday.name}! Warm wishes from Saven Technologies! May this occasion bring joy and prosperity to you and your family! 🙏`,
        type: 'festival',
        navigateTo: '/holidays',
      });

      console.log(`[FestivalWisher] Festival wish sent for: ${holiday.name} on ${today}`);
    } catch (err) {
      console.error('[FestivalWisher] Cron job failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[FestivalWisher] Cron job scheduled — runs daily at 7:00 AM IST.');
}

// Export runner so it can be triggered manually for testing
async function runFestivalWisherNow() {
  try {
    const today = getTodayIST();
    const holiday = await HolidayCalendar.findOne({ where: { date: today } });
    if (!holiday) {
      return { triggered: false, message: `No holiday found for today (${today})` };
    }
    await notifyAllActiveUsers({
      title: `🎊 Happy ${holiday.name}!`,
      message: `🎊 Happy ${holiday.name}! Warm wishes from Saven Technologies! May this occasion bring joy and prosperity to you and your family! 🙏`,
      type: 'festival',
      navigateTo: '/holidays',
    });
    return { triggered: true, holiday: holiday.name, date: today };
  } catch (err) {
    return { triggered: false, error: err.message };
  }
}

module.exports = { startFestivalWisherJob, runFestivalWisherNow };
