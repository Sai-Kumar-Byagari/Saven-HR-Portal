const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const settingsController = require('../controllers/settings.controller');

router.get('/audit-logs', authMiddleware, rbac('super_admin'), settingsController.getAuditLogs);
router.get('/system-info', authMiddleware, rbac('super_admin'), settingsController.getSystemInfo);
router.get('/search', authMiddleware, settingsController.globalSearch);

// Manual test triggers (super_admin only)
router.post('/test/birthday-wishes', authMiddleware, rbac('super_admin'), settingsController.triggerBirthdayWishes);
router.post('/test/festival-wishes', authMiddleware, rbac('super_admin'), settingsController.triggerFestivalWishes);

module.exports = router;
