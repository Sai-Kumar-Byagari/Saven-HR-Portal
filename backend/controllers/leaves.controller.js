const { validationResult } = require('express-validator');
const { Leave, User, LeaveBalance, HolidayCalendar } = require('../models');
const { Op } = require('sequelize');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const { getFinancialYear } = require('../utils/dateHelpers');
const leaveService = require('../services/leave.service');
const { createNotification } = require('../services/notification.service');

async function applyLeave(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { leave_type, from_date, to_date, reason } = req.body;
    const userId = req.user.id;

    // Check holiday conflicts on frontend is validated; backend double-check
    const holidays = await HolidayCalendar.findAll({
      where: { date: { [Op.between]: [from_date, to_date] } },
    });
    if (holidays.length > 0 && from_date === to_date) {
      return res.status(400).json({ success: false, message: 'Selected date is a holiday.', errors: [] });
    }

    const days = await leaveService.calculateLeaveDays(from_date, to_date);
    if (days <= 0) {
      return res.status(400).json({ success: false, message: 'No working days in the selected range.', errors: [] });
    }

    // Work from home & unpaid leave - no balance check needed
    if (leave_type !== 'unpaid_leave' && leave_type !== 'work_from_home') {
      const { hasBalance, remaining } = await leaveService.checkLeaveBalance(userId, days);
      if (!hasBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance. You have ${remaining} days remaining.`,
          errors: [],
        });
      }
    }

    // Check for overlapping leaves
    const overlap = await Leave.findOne({
      where: {
        user_id: userId,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          { from_date: { [Op.between]: [from_date, to_date] } },
          { to_date: { [Op.between]: [from_date, to_date] } },
          { from_date: { [Op.lte]: from_date }, to_date: { [Op.gte]: to_date } },
        ],
      },
    });

    if (overlap) {
      return res.status(400).json({ success: false, message: 'Leave request overlaps with an existing leave.', errors: [] });
    }

    const leave = await Leave.create({
      user_id: userId,
      leave_type,
      from_date,
      to_date,
      days,
      reason,
      status: 'pending',
    });

    // Notify reporting manager
    const user = await User.findByPk(userId);
    if (user.reporting_manager_id) {
      await createNotification({
        userId: user.reporting_manager_id,
        title: 'New Leave Request',
        message: `${user.first_name} ${user.last_name} has applied for ${days} day(s) of ${leave_type.replace('_', ' ')}.`,
        type: 'leave',
        referenceId: leave.id,
        referenceType: 'leave',
        navigateTo: `/leaves/approval`,
      });
    }

    return res.status(201).json({ success: true, message: 'Leave applied successfully.', data: leave });
  } catch (err) {
    next(err);
  }
}

async function getMyLeaves(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, year } = req.query;
    const where = { user_id: req.user.id };
    if (status) where.status = status;
    if (year) {
      where[Op.and] = [
        { from_date: { [Op.gte]: `${year}-01-01` } },
        { to_date: { [Op.lte]: `${year}-12-31` } },
      ];
    }

    const { count, rows } = await Leave.findAndCountAll({
      where,
      include: [{ model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name'], required: false }],
      limit,
      offset,
      order: [['applied_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Leaves fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getMyLeaveBalance(req, res, next) {
  try {
    const balance = await leaveService.getOrCreateLeaveBalance(req.user.id);
    return res.status(200).json({ success: true, message: 'Leave balance fetched.', data: balance });
  } catch (err) {
    next(err);
  }
}

async function getPendingLeaves(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);

    // Manager sees their team's pending leaves; super_admin sees all
    const where = { status: 'pending' };
    if (req.user.role === 'manager') {
      const team = await User.findAll({
        where: { reporting_manager_id: req.user.id, is_active: true },
        attributes: ['id'],
      });
      const teamIds = team.map((u) => u.id);
      where.user_id = { [Op.in]: teamIds };
    }

    const { count, rows } = await Leave.findAndCountAll({
      where,
      include: [{
        model: User, as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'work_email', 'role'],
      }],
      limit,
      offset,
      order: [['applied_at', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Pending leaves fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function approveRejectLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' | 'reject'

    const leave = await Leave.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'reporting_manager_id'] }],
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found.', errors: [] });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave is no longer pending.', errors: [] });
    }

    // Manager can only approve their team members
    if (req.user.role === 'manager' && leave.user.reporting_manager_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to act on this leave.', errors: [] });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await leave.update({ status: newStatus, approved_by: req.user.id, approver_comment: comment });

    if (newStatus === 'approved') {
      if (leave.leave_type === 'work_from_home') {
        // WFH: no balance deduction, mark attendance as present (remote)
        await leaveService.markAttendanceAsPresent(leave.user_id, leave.from_date, leave.to_date);
      } else {
        await leaveService.deductLeaveBalance(leave.user_id, parseFloat(leave.days));
        await leaveService.markAttendanceOnLeave(leave.user_id, leave.from_date, leave.to_date);
      }
    }

    // Notify employee
    await createNotification({
      userId: leave.user_id,
      title: `Leave ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      message: `Your leave request from ${leave.from_date} to ${leave.to_date} has been ${newStatus}. ${comment ? 'Comment: ' + comment : ''}`,
      type: 'leave',
      referenceId: leave.id,
      referenceType: 'leave',
      navigateTo: `/leaves/my`,
    });

    return res.status(200).json({ success: true, message: `Leave ${newStatus}.`, data: leave });
  } catch (err) {
    next(err);
  }
}

async function getAllLeavesManagement(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const fy = getFinancialYear();

    const users = await User.findAll({
      where: { is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'work_email', 'role'],
    });

    const results = await Promise.all(
      users.map(async (u) => {
        const balance = await leaveService.getOrCreateLeaveBalance(u.id);
        return {
          user: u,
          total: balance.total_leaves,
          used_total: balance.used_leaves,
          used_this_month: balance.current_month_used,
          remaining: balance.total_leaves - parseFloat(balance.used_leaves),
          financial_year: fy,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Leave management data fetched.',
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

async function cancelLeave(req, res, next) {
  try {
    const { id } = req.params;
    const leave = await Leave.findByPk(id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.', errors: [] });
    if (leave.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not your leave.', errors: [] });
    if (leave.status === 'approved' && leave.leave_type !== 'work_from_home') {
      await leaveService.restoreLeaveBalance(leave.user_id, parseFloat(leave.days));
    }
    await leave.update({ status: 'rejected', approver_comment: 'Cancelled by employee' });
    return res.status(200).json({ success: true, message: 'Leave cancelled.', data: leave });
  } catch (err) {
    next(err);
  }
}

module.exports = { applyLeave, getMyLeaves, getMyLeaveBalance, getPendingLeaves, approveRejectLeave, getAllLeavesManagement, cancelLeave };
