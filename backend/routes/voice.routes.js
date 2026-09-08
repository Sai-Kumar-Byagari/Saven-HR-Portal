const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const voiceController = require('../controllers/voice.controller');

router.post('/', authMiddleware, voiceController.submitVoice);
router.get('/inbox', authMiddleware, rbac('super_admin', 'manager'), voiceController.getVoiceInbox);
router.put('/:id/status', authMiddleware, rbac('super_admin', 'manager'), voiceController.updateVoiceStatus);

module.exports = router;
