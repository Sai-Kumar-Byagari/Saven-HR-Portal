const cron = require('node-cron');
const { LeaveBalance, User } = require('../models');
const { getFinancialYear } = require('../utils/dateHelpers');

// Runs every April 1st at 12:01 AM IST
function startLeaveResetJob() {
  cron.schedule('1 0 1 4 *', async () => {
    try {
      const newFY = getFinancialYear(new Date());
      console.log(`[LeaveReset] Resetting leave balances for FY ${newFY}`);

      // Reset current month used for all existing balances
      await LeaveBalance.update({ current_month_used: 0 }, { where: {} });

      // Create new FY balances for all active users
      const activeUsers = await User.findAll({ where: { is_active: true }, attributes: ['id'] });
      for (const user of activeUsers) {
        const [balance, created] = await LeaveBalance.findOrCreate({
          where: { user_id: user.id, financial_year: newFY },
          defaults: { total_leaves: 18, used_leaves: 0, current_month_used: 0 },
        });
        if (!created) {
          await balance.update({ total_leaves: 18, used_leaves: 0, current_month_used: 0 });
        }
      }

      console.log(`[LeaveReset] Leave balances reset for ${activeUsers.length} employees. New FY: ${newFY}`);
    } catch (err) {
      console.error('[LeaveReset] Cron job failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  // Also reset monthly counter on 1st of every month
  cron.schedule('5 0 1 * *', async () => {
    try {
      await LeaveBalance.update({ current_month_used: 0 }, { where: {} });
      console.log('[LeaveReset] Monthly leave counters reset.');
    } catch (err) {
      console.error('[LeaveReset] Monthly reset failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[LeaveReset] Cron jobs scheduled.');
}

module.exports = { startLeaveResetJob };
