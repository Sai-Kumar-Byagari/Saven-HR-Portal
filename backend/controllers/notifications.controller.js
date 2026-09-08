const { Notification } = require('../models');
const { getPagination, getPaginationMeta } = require('../utils/paginate');

async function getNotifications(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { is_read } = req.query;
    const where = { user_id: req.user.id };
    if (is_read !== undefined) where.is_read = is_read === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await Notification.count({ where: { user_id: req.user.id, is_read: false } });
    return res.status(200).json({ success: true, message: 'Unread count.', data: { count } });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ where: { id, user_id: req.user.id } });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.', errors: [] });
    }
    await notification.update({ is_read: true });
    return res.status(200).json({ success: true, message: 'Marked as read.', data: notification });
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
    return res.status(200).json({ success: true, message: 'All notifications marked as read.', data: {} });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ where: { id, user_id: req.user.id } });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.', errors: [] });
    }
    await notification.destroy();
    return res.status(200).json({ success: true, message: 'Notification deleted.', data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
