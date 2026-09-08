const { Notification, User } = require('../models');

async function createNotification({ userId, title, message, type = 'general', referenceId, referenceType, navigateTo }) {
  try {
    return await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      reference_id: referenceId || null,
      reference_type: referenceType || null,
      navigate_to: navigateTo || null,
      is_read: false,
    });
  } catch (err) {
    console.error('[NotificationService] Failed to create notification:', err.message);
    return null;
  }
}

async function createBulkNotifications(userIds, { title, message, type, referenceId, referenceType, navigateTo }) {
  try {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      type: type || 'general',
      reference_id: referenceId || null,
      reference_type: referenceType || null,
      navigate_to: navigateTo || null,
      is_read: false,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    return await Notification.bulkCreate(notifications);
  } catch (err) {
    console.error('[NotificationService] Failed to create bulk notifications:', err.message);
    return null;
  }
}

async function notifyAllActiveUsers({ title, message, type, referenceId, referenceType, navigateTo }) {
  try {
    const users = await User.findAll({
      where: { is_active: true },
      attributes: ['id'],
    });
    const userIds = users.map((u) => u.id);
    return createBulkNotifications(userIds, { title, message, type, referenceId, referenceType, navigateTo });
  } catch (err) {
    console.error('[NotificationService] Failed to notify all users:', err.message);
    return null;
  }
}

module.exports = { createNotification, createBulkNotifications, notifyAllActiveUsers };
