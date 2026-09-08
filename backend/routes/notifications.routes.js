const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const notificationsController = require('../controllers/notifications.controller');

router.get('/', authMiddleware, notificationsController.getNotifications);
router.get('/unread-count', authMiddleware, notificationsController.getUnreadCount);
router.put('/mark-all-read', authMiddleware, notificationsController.markAllAsRead);
router.put('/:id/read', authMiddleware, notificationsController.markAsRead);
router.delete('/:id', authMiddleware, notificationsController.deleteNotification);

module.exports = router;
