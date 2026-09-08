const { LeaveBalance, Leave, Attendance, HolidayCalendar } = require('../models');
const { getFinancialYear } = require('../utils/dateHelpers');
const { Op } = require('sequelize');

async function getOrCreateLeaveBalance(userId) {
  const fy = getFinancialYear();
  const [balance] = await LeaveBalance.findOrCreate({
    where: { user_id: userId, financial_year: fy },
    defaults: { total_leaves: 18, used_leaves: 0, current_month_used: 0 },
  });
  return balance;
}

async function checkLeaveBalance(userId, days) {
  const balance = await getOrCreateLeaveBalance(userId);
  const remaining = balance.total_leaves - parseFloat(balance.used_leaves);
  return { hasBalance: remaining >= days, remaining, balance };
}

async function deductLeaveBalance(userId, days) {
  const balance = await getOrCreateLeaveBalance(userId);
  const newUsed = Math.max(0, parseFloat(balance.used_leaves) + days);
  const newMonthUsed = parseFloat(balance.current_month_used) + days;
  if (newUsed > balance.total_leaves) {
    throw new Error('Insufficient leave balance.');
  }
  await balance.update({ used_leaves: newUsed, current_month_used: newMonthUsed });
  return balance;
}

async function restoreLeaveBalance(userId, days) {
  const balance = await getOrCreateLeaveBalance(userId);
  const newUsed = Math.max(0, parseFloat(balance.used_leaves) - days);
  await balance.update({ used_leaves: newUsed });
  return balance;
}

async function isHoliday(date) {
  const holiday = await HolidayCalendar.findOne({ where: { date } });
  return !!holiday;
}

async function markAttendanceOnLeave(userId, fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      await Attendance.upsert({
        user_id: userId,
        date: dateStr,
        status: 'on_leave',
      });
    }
    current.setDate(current.getDate() + 1);
  }
}

async function calculateLeaveDays(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    const holiday = await isHoliday(dateStr);
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holiday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

async function markAttendanceAsPresent(userId, fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      await Attendance.upsert({
        user_id: userId,
        date: dateStr,
        status: 'present',
      });
    }
    current.setDate(current.getDate() + 1);
  }
}

/**
 * Returns the count of 'absent' attendance records for a user in the current FY.
 * These are the days auto-deducted by the absent marker job.
 */
async function getAbsentDeductionCount(userId) {
  const { getFinancialYear: getFY, getFYDates } = require('../utils/dateHelpers');
  const fy = getFY();
  const { startDate, endDate } = getFYDates(fy);
  const count = await Attendance.count({
    where: {
      user_id: userId,
      status: 'absent',
      date: { [Op.between]: [startDate, endDate] },
    },
  });
  return count;
}

module.exports = {
  getOrCreateLeaveBalance,
  checkLeaveBalance,
  deductLeaveBalance,
  restoreLeaveBalance,
  markAttendanceOnLeave,
  markAttendanceAsPresent,
  calculateLeaveDays,
  getAbsentDeductionCount,
};

