const { Attendance, User, Leave } = require('../models');
const { Op } = require('sequelize');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const { getTodayString } = require('../utils/dateHelpers');
const leaveService = require('../services/leave.service');
const { createNotification } = require('../services/notification.service');

// ── Punch In (with selfie photo) ──────────────────────────────────────────────
async function clockIn(req, res, next) {
  try {
    const userId = req.user.id;
    const today = getTodayString();
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

    const existing = await Attendance.findOne({ where: { user_id: userId, date: today } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already punched in today.', errors: [] });
    }

    // Photo is optional but expected
    const photoPath = req.file
      ? req.file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/')
      : null;

    if (!photoPath) {
      return res.status(400).json({ success: false, message: 'Punch-in photo is required.', errors: [] });
    }

    const record = await Attendance.create({
      user_id: userId,
      date: today,
      clock_in: timeStr,
      punch_in_photo: photoPath,
      status: 'present',
    });

    return res.status(201).json({ success: true, message: 'Punched in successfully.', data: record });
  } catch (err) {
    next(err);
  }
}

// ── Punch Out (with selfie photo) ─────────────────────────────────────────────
async function clockOut(req, res, next) {
  try {
    const userId = req.user.id;
    const today = getTodayString();
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const record = await Attendance.findOne({ where: { user_id: userId, date: today } });
    if (!record) {
      return res.status(400).json({ success: false, message: 'No punch-in found for today.', errors: [] });
    }
    if (record.clock_out) {
      return res.status(400).json({ success: false, message: 'Already punched out today.', errors: [] });
    }

    const photoPath = req.file
      ? req.file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/')
      : null;

    if (!photoPath) {
      return res.status(400).json({ success: false, message: 'Punch-out photo is required.', errors: [] });
    }

    // Calculate duration
    const clockInTime  = new Date(`${today}T${record.clock_in}`);
    const clockOutTime = new Date(`${today}T${timeStr}`);
    const durationMins = Math.round((clockOutTime - clockInTime) / 60000);
    const status = 'present';

    await record.update({
      clock_out: timeStr,
      punch_out_photo: photoPath,
      duration_mins: durationMins,
      status,
    });

    return res.status(200).json({ success: true, message: 'Punched out successfully.', data: record });
  } catch (err) {
    next(err);
  }
}

async function getTodayAttendance(req, res, next) {
  try {
    const today = getTodayString();
    const record = await Attendance.findOne({ where: { user_id: req.user.id, date: today } });
    return res.status(200).json({ success: true, message: 'Today\'s attendance.', data: record || null });
  } catch (err) {
    next(err);
  }
}

async function getMyAttendance(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { month, year } = req.query;
    const where = { user_id: req.user.id };

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      limit,
      offset,
      order: [['date', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getTeamAttendance(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { date, from_date, to_date } = req.query;

    // Get direct reports
    const teamMembers = await User.findAll({
      where: { reporting_manager_id: req.user.id, is_active: true },
      attributes: ['id'],
    });
    const teamIds = teamMembers.map((u) => u.id);

    if (teamIds.length === 0) {
      return res.status(200).json({ success: true, message: 'No team members.', data: [], pagination: getPaginationMeta(0, 1, limit) });
    }

    const where = { user_id: { [Op.in]: teamIds } };
    if (date) where.date = date;
    else if (from_date && to_date) where.date = { [Op.between]: [from_date, to_date] };

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [{
        model: User, as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'work_email', 'role'],
        required: true,
      }],
      limit,
      offset,
      order: [['date', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Team attendance fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getAllAttendance(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { date, from_date, to_date, user_id } = req.query;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (date) where.date = date;
    else if (from_date && to_date) where.date = { [Op.between]: [from_date, to_date] };

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [{
        model: User, as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'work_email', 'role'],
      }],
      limit,
      offset,
      order: [['date', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'All attendance fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getWeeklyAttendanceSummary(req, res, next) {
  try {
    const { sequelize } = require('../models');
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = friday.toISOString().split('T')[0];

    // Get team members if manager, all if admin
    let userIds = null;
    if (req.user.role === 'manager') {
      const team = await User.findAll({ where: { reporting_manager_id: req.user.id, is_active: true }, attributes: ['id'] });
      userIds = team.map((u) => u.id);
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'hr') {
      userIds = [req.user.id];
    }

    const where = { date: { [Op.between]: [startDate, endDate] } };
    if (userIds) where.user_id = { [Op.in]: userIds };

    const records = await Attendance.findAll({ where, attributes: ['date', 'status'] });

    const summary = {};
    let current = new Date(monday);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    for (let i = 0; i < 5; i++) {
      const ds = current.toISOString().split('T')[0];
      summary[ds] = { day: days[i], date: ds, present: 0, absent: 0, on_leave: 0 };
      current.setDate(current.getDate() + 1);
    }

    records.forEach((r) => {
      if (summary[r.date]) {
        summary[r.date][r.status] = (summary[r.date][r.status] || 0) + 1;
      }
    });

    return res.status(200).json({ success: true, message: 'Weekly summary.', data: Object.values(summary) });
  } catch (err) {
    next(err);
  }
}

module.exports = { clockIn, clockOut, getTodayAttendance, getMyAttendance, getTeamAttendance, getAllAttendance, getWeeklyAttendanceSummary, updateAttendanceStatus, getAbsentSummary, downloadAttendanceReport, getUserReport };

// ── Attendance Report (CSV download) ──────────────────────────────────────────
async function downloadAttendanceReport(req, res, next) {
  try {
    const { month, year } = req.query;
    const reportMonth = parseInt(month) || (new Date().getMonth() + 1);
    const reportYear = parseInt(year) || new Date().getFullYear();

    // Build date range for the month
    const startDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(reportYear, reportMonth, 0).getDate();
    const endDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Scope by role
    let userWhere = { is_active: true };
    if (req.user.role === 'manager') {
      userWhere.reporting_manager_id = req.user.id;
    }
    // super_admin, hr, payroll see all

    const users = await User.findAll({
      where: userWhere,
      attributes: ['id', 'first_name', 'last_name', 'work_email', 'role', 'emp_id'],
      order: [['first_name', 'ASC']],
    });

    const userIds = users.map(u => u.id);

    const records = await Attendance.findAll({
      where: {
        user_id: { [Op.in]: userIds },
        date: { [Op.between]: [startDate, endDate] },
      },
      attributes: ['user_id', 'date', 'status', 'clock_in', 'clock_out'],
      order: [['date', 'ASC']],
    });

    // Group records by user
    const byUser = {};
    records.forEach(r => {
      if (!byUser[r.user_id]) byUser[r.user_id] = [];
      byUser[r.user_id].push(r);
    });

    // Build report data
    const reportData = users.map(u => {
      const userRecords = byUser[u.id] || [];
      const presentDays = userRecords.filter(r => r.status === 'present').length;
      const absentDays = userRecords.filter(r => r.status === 'absent').length;
      const onLeaveDays = userRecords.filter(r => r.status === 'on_leave').length;
      const absentDates = userRecords.filter(r => r.status === 'absent').map(r => r.date).join('; ');
      const onLeaveDates = userRecords.filter(r => r.status === 'on_leave').map(r => r.date).join('; ');

      return {
        emp_id: u.emp_id || '',
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        role: u.role,
        total_records: userRecords.length,
        present_days: presentDays,
        absent_days: absentDays,
        on_leave_days: onLeaveDays,
        absent_dates: absentDates,
        on_leave_dates: onLeaveDates,
      };
    });

    // Check if CSV download requested
    if (req.query.format === 'csv') {
      const headers = ['Emp ID', 'Name', 'Email', 'Role', 'Total Records', 'Present Days', 'Absent Days', 'On Leave Days', 'Absent Dates', 'On Leave Dates'];
      const csvRows = [headers.join(',')];
      reportData.forEach(row => {
        csvRows.push([
          row.emp_id,
          `"${row.name}"`,
          row.email,
          row.role,
          row.total_records,
          row.present_days,
          row.absent_days,
          row.on_leave_days,
          `"${row.absent_dates}"`,
          `"${row.on_leave_dates}"`,
        ].join(','));
      });

      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${monthNames[reportMonth - 1]}_${reportYear}.csv"`);
      return res.send(csvRows.join('\n'));
    }

    // JSON response
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return res.status(200).json({
      success: true,
      message: `Attendance report for ${monthNames[reportMonth - 1]} ${reportYear}.`,
      data: {
        month: reportMonth,
        year: reportYear,
        monthName: monthNames[reportMonth - 1],
        report: reportData,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Absent Summary (per-user absent counts for Leave Management) ──────────────
async function getAbsentSummary(req, res, next) {
  try {
    const users = await User.findAll({
      where: { is_active: true },
      attributes: ['id'],
    });

    const results = {};
    for (const u of users) {
      results[u.id] = await leaveService.getAbsentDeductionCount(u.id);
    }

    return res.status(200).json({
      success: true,
      message: 'Absent summary fetched.',
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

// ── Update Attendance Status (Manager/Admin — mark absent as present) ─────────
async function updateAttendanceStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be present or absent.', errors: [] });
    }

    const record = await Attendance.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'role', 'reporting_manager_id'] }],
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.', errors: [] });
    }

    // Manager can only update their team members
    if (req.user.role === 'manager' && record.user.reporting_manager_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized. This employee is not in your team.', errors: [] });
    }

    const oldStatus = record.status;

    // If changing from absent → present: restore 1 deducted leave
    if (oldStatus === 'absent' && status === 'present') {
      try {
        await leaveService.restoreLeaveBalance(record.user_id, 1);
      } catch (err) {
        console.warn(`[UpdateAttendance] Could not restore leave balance for user ${record.user_id}:`, err.message);
      }
    }

    // If changing from present → absent: deduct 1 leave
    if (oldStatus === 'present' && status === 'absent') {
      try {
        await leaveService.deductLeaveBalance(record.user_id, 1);
      } catch (err) {
        console.warn(`[UpdateAttendance] Could not deduct leave balance for user ${record.user_id}:`, err.message);
      }
    }

    await record.update({ status });

    // Notify the employee
    const statusLabel = status === 'present' ? 'Present' : 'Absent';
    await createNotification({
      userId: record.user_id,
      title: 'Attendance Updated',
      message: `Your attendance for ${record.date} has been updated to "${statusLabel}" by ${req.user.role === 'super_admin' ? 'Admin' : 'your Manager'}.`,
      type: 'attendance',
      referenceId: record.id,
      referenceType: 'attendance',
      navigateTo: '/attendance/my',
    });

    return res.status(200).json({
      success: true,
      message: `Attendance updated to ${statusLabel}. ${oldStatus === 'absent' && status !== 'absent' ? 'Leave balance restored.' : ''}`,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

// ── Per-User Attendance Report (month-by-month breakdown) ─────────────────────
async function getUserReport(req, res, next) {
  try {
    const userId = parseInt(req.params.userId);
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.', errors: [] });

    // Manager can only view their team
    if (req.user.role === 'manager' && user.reporting_manager_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.', errors: [] });
    }

    // Get financial year range
    const { getFYDates, getFinancialYear } = require('../utils/dateHelpers');
    const fy = getFinancialYear();
    const { startDate, endDate } = getFYDates(fy);

    const records = await Attendance.findAll({
      where: { user_id: userId, date: { [Op.between]: [startDate, endDate] } },
      attributes: ['date', 'status', 'clock_in', 'clock_out'],
      order: [['date', 'ASC']],
      raw: true,
    });

    // Group by month
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthlyData = {};

    records.forEach(r => {
      const dateStr = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0];
      const d = new Date(dateStr + 'T12:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: monthNames[d.getMonth()], year: d.getFullYear(), present: 0, absent: 0, on_leave: 0, absent_dates: [], on_leave_dates: [] };
      }
      if (r.status === 'present') monthlyData[key].present++;
      else if (r.status === 'absent') { monthlyData[key].absent++; monthlyData[key].absent_dates.push(dateStr); }
      else if (r.status === 'on_leave') { monthlyData[key].on_leave++; monthlyData[key].on_leave_dates.push(dateStr); }
    });

    const months = Object.values(monthlyData);

    // CSV format
    if (req.query.format === 'csv') {
      const headers = ['Month', 'Year', 'Present Days', 'Absent Days', 'On Leave Days', 'Absent Dates', 'On Leave Dates'];
      const csvRows = [headers.join(',')];
      months.forEach(m => {
        csvRows.push([m.month, m.year, m.present, m.absent, m.on_leave, `"${m.absent_dates.join('; ')}"`, `"${m.on_leave_dates.join('; ')}"`].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${user.first_name}_${user.last_name}_attendance_${fy}.csv"`);
      return res.send(csvRows.join('\n'));
    }

    return res.status(200).json({
      success: true,
      message: `Attendance report for ${user.first_name} ${user.last_name}.`,
      data: {
        user: { id: user.id, name: `${user.first_name} ${user.last_name}`, emp_id: user.emp_id || '', email: user.work_email, role: user.role },
        financial_year: fy,
        months,
        totals: {
          present: records.filter(r => r.status === 'present').length,
          absent: records.filter(r => r.status === 'absent').length,
          on_leave: records.filter(r => r.status === 'on_leave').length,
        },
      },
    });
  } catch (err) {
    console.error('[getUserReport] Error:', err);
    next(err);
  }
}
