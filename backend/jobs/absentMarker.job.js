const cron = require('node-cron');
const { Attendance, User, HolidayCalendar } = require('../models');
const { Op } = require('sequelize');
const leaveService = require('../services/leave.service');

/**
 * Core logic: mark absent for a specific date.
 * Reused by both the cron job and the catch-up function.
 */
async function markAbsentForDate(dateStr) {
  const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay();
  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) return 0;

  // Skip holidays
  const holiday = await HolidayCalendar.findOne({ where: { date: dateStr } });
  if (holiday) {
    console.log(`[AbsentMarker] ${dateStr} is a holiday (${holiday.name}). Skipping.`);
    return 0;
  }

  // Get eligible employees
  const eligibleUsers = await User.findAll({
    where: {
      is_active: true,
      role: { [Op.in]: ['employee', 'it', 'payroll', 'hr'] },
    },
    attributes: ['id', 'first_name', 'last_name', 'role'],
  });

  if (eligibleUsers.length === 0) return 0;

  const userIds = eligibleUsers.map(u => u.id);

  // Find users who already have a record for this date
  const existingRecords = await Attendance.findAll({
    where: { user_id: { [Op.in]: userIds }, date: dateStr },
    attributes: ['user_id'],
  });
  const alreadyMarkedIds = new Set(existingRecords.map(r => r.user_id));

  const absentUsers = eligibleUsers.filter(u => !alreadyMarkedIds.has(u.id));

  let markedCount = 0;
  for (const user of absentUsers) {
    try {
      await Attendance.create({
        user_id: user.id,
        date: dateStr,
        status: 'absent',
      });

      try {
        await leaveService.deductLeaveBalance(user.id, 1);
      } catch (balErr) {
        console.warn(`[AbsentMarker] Could not deduct leave for ${user.first_name} ${user.last_name} (ID: ${user.id}): ${balErr.message}`);
      }

      markedCount++;
    } catch (err) {
      console.error(`[AbsentMarker] Failed to mark absent for user ${user.id} on ${dateStr}:`, err.message);
    }
  }

  if (markedCount > 0) {
    console.log(`[AbsentMarker] ${dateStr}: Marked ${markedCount} employees as absent.`);
  }
  return markedCount;
}

/**
 * Cron job — runs at 11 PM IST Mon-Fri.
 */
function startAbsentMarkerJob() {
  cron.schedule('0 23 * * 1-5', async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await markAbsentForDate(today);
    } catch (err) {
      console.error('[AbsentMarker] Cron job failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[AbsentMarker] Cron job scheduled (11:00 PM IST, Mon-Fri).');
}

/**
 * Catch-up function — runs on server startup.
 * Checks the last 7 working days and marks absent for any missed days.
 */
async function catchUpAbsentMarker() {
  try {
    console.log('[AbsentMarker] Running catch-up for missed days...');
    const today = new Date();
    let totalMarked = 0;

    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      totalMarked += await markAbsentForDate(dateStr);
    }

    if (totalMarked > 0) {
      console.log(`[AbsentMarker] Catch-up complete: Marked ${totalMarked} total absent records.`);
    } else {
      console.log('[AbsentMarker] Catch-up complete: No missed absences found.');
    }
  } catch (err) {
    console.error('[AbsentMarker] Catch-up failed:', err.message);
  }
}

module.exports = { startAbsentMarkerJob, catchUpAbsentMarker };

