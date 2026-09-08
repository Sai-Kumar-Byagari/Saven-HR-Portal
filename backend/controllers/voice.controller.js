const { EmployeeVoice, User } = require('../models');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const { createNotification } = require('../services/notification.service');
const { Op } = require('sequelize');

async function submitVoice(req, res, next) {
  try {
    const { type, message, is_anonymous } = req.body;
    const userId = req.user.id;

    const voice = await EmployeeVoice.create({
      user_id: userId,
      type,
      message,
      is_anonymous: !!is_anonymous,
    });

    const user = await User.findByPk(userId, { attributes: ['first_name', 'last_name', 'reporting_manager_id'] });
    const senderName = is_anonymous ? 'Anonymous Employee' : `${user.first_name} ${user.last_name}`;

    // Notify reporting manager
    if (user.reporting_manager_id) {
      await createNotification({
        userId: user.reporting_manager_id,
        title: 'New Employee Voice',
        message: `${senderName} submitted a ${type}: "${message.substring(0, 80)}..."`,
        type: 'voice',
        referenceId: voice.id,
        referenceType: 'voice',
        navigateTo: '/voice/inbox',
      });
    }

    // Notify super admin
    const superAdmins = await User.findAll({ where: { role: 'super_admin', is_active: true }, attributes: ['id'] });
    for (const admin of superAdmins) {
      if (admin.id !== user.reporting_manager_id) {
        await createNotification({
          userId: admin.id,
          title: 'New Employee Voice',
          message: `${senderName} submitted a ${type}`,
          type: 'voice',
          referenceId: voice.id,
          referenceType: 'voice',
          navigateTo: '/voice/inbox',
        });
      }
    }

    return res.status(201).json({ success: true, message: 'Voice submitted.', data: { id: voice.id } });
  } catch (err) {
    next(err);
  }
}

async function getVoiceInbox(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { type, status, from_date, to_date } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (from_date && to_date) where.created_at = { [Op.between]: [from_date, to_date] };

    // For managers, scope to their team
    if (req.user.role === 'manager') {
      const team = await User.findAll({ where: { reporting_manager_id: req.user.id }, attributes: ['id'] });
      where.user_id = { [Op.in]: team.map((u) => u.id) };
    }

    const { count, rows } = await EmployeeVoice.findAndCountAll({
      where,
      include: [{
        model: User, as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'work_email', 'role'],
      }],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    // Hide sender if anonymous
    const data = rows.map((v) => {
      const obj = v.toJSON();
      if (obj.is_anonymous) {
        obj.user = { id: null, first_name: 'Anonymous', last_name: '', work_email: '', role: '' };
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      message: 'Voice inbox fetched.',
      data,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function updateVoiceStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const voice = await EmployeeVoice.findByPk(id);
    if (!voice) return res.status(404).json({ success: false, message: 'Voice not found.', errors: [] });
    await voice.update({ status });
    return res.status(200).json({ success: true, message: 'Status updated.', data: voice });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitVoice, getVoiceInbox, updateVoiceStatus };
