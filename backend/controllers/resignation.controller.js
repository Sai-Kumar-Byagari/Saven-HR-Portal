const { ResignationForm, ResignationFeedback, User } = require('../models');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const { createNotification } = require('../services/notification.service');

async function submitResignation(req, res, next) {
  try {
    const { last_working_day, reason, notice_period_acknowledgment } = req.body;
    const userId = req.user.id;

    const existing = await ResignationForm.findOne({ where: { user_id: userId, status: ['submitted', 'acknowledged'] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active resignation.', errors: [] });
    }

    const resignation = await ResignationForm.create({
      user_id: userId,
      last_working_day,
      reason,
      notice_period_acknowledgment: !!notice_period_acknowledgment,
    });

    const user = await User.findByPk(userId, { attributes: ['first_name', 'last_name', 'reporting_manager_id'] });

    // Notify manager
    if (user.reporting_manager_id) {
      await createNotification({
        userId: user.reporting_manager_id,
        title: 'Resignation Submitted',
        message: `${user.first_name} ${user.last_name} has submitted their resignation. Last working day: ${last_working_day}.`,
        type: 'resignation',
        referenceId: resignation.id,
        referenceType: 'resignation',
        navigateTo: '/resignation/inbox',
      });
    }

    // Notify super admins
    const admins = await User.findAll({ where: { role: 'super_admin', is_active: true }, attributes: ['id'] });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'Resignation Submitted',
        message: `${user.first_name} ${user.last_name} has submitted their resignation.`,
        type: 'resignation',
        referenceId: resignation.id,
        referenceType: 'resignation',
        navigateTo: '/resignation/inbox',
      });
    }

    return res.status(201).json({ success: true, message: 'Resignation submitted.', data: resignation });
  } catch (err) {
    next(err);
  }
}

async function getMyResignation(req, res, next) {
  try {
    const resignation = await ResignationForm.findOne({
      where: { user_id: req.user.id },
      include: [{ model: ResignationFeedback, as: 'feedback', required: false }],
      order: [['submitted_at', 'DESC']],
    });
    return res.status(200).json({ success: true, message: 'Resignation fetched.', data: resignation });
  } catch (err) {
    next(err);
  }
}

async function getResignationInbox(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = {};

    if (req.user.role === 'manager') {
      const team = await User.findAll({ where: { reporting_manager_id: req.user.id }, attributes: ['id'] });
      const { Op } = require('sequelize');
      where.user_id = { [Op.in]: team.map((u) => u.id) };
    }

    const { count, rows } = await ResignationForm.findAndCountAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'work_email', 'role', 'doj'] },
        { model: ResignationFeedback, as: 'feedback', required: false },
      ],
      limit,
      offset,
      order: [['submitted_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Resignation inbox fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function updateResignationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const resignation = await ResignationForm.findByPk(id);
    if (!resignation) return res.status(404).json({ success: false, message: 'Resignation not found.', errors: [] });
    await resignation.update({ status });
    return res.status(200).json({ success: true, message: 'Status updated.', data: resignation });
  } catch (err) {
    next(err);
  }
}

async function submitExitFeedback(req, res, next) {
  try {
    const { resignation_id } = req.params;
    const { feedback_text, rating, reason_for_leaving, suggestions, would_rejoin } = req.body;

    const resignation = await ResignationForm.findOne({ where: { id: resignation_id, user_id: req.user.id } });
    if (!resignation) return res.status(404).json({ success: false, message: 'Resignation not found.', errors: [] });

    const existing = await ResignationFeedback.findOne({ where: { resignation_id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted.', errors: [] });
    }

    const feedback = await ResignationFeedback.create({
      resignation_id, feedback_text, rating, reason_for_leaving, suggestions,
      would_rejoin: would_rejoin !== undefined ? !!would_rejoin : null,
    });

    return res.status(201).json({ success: true, message: 'Exit feedback submitted.', data: feedback });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitResignation, getMyResignation, getResignationInbox, updateResignationStatus, submitExitFeedback };
