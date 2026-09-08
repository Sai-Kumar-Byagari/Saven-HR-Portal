const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const resignationController = require('../controllers/resignation.controller');

router.post('/', authMiddleware, resignationController.submitResignation);
router.get('/my', authMiddleware, resignationController.getMyResignation);
router.get('/inbox', authMiddleware, rbac('super_admin', 'manager'), resignationController.getResignationInbox);
router.put('/:id/status', authMiddleware, rbac('super_admin', 'manager'), resignationController.updateResignationStatus);
router.post('/:resignation_id/exit-feedback', authMiddleware, resignationController.submitExitFeedback);

module.exports = router;
