const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const onboardingController = require('../controllers/onboarding.controller');

router.get('/tasks', authMiddleware, onboardingController.getOnboardingTasks);
router.get('/tasks/:userId', authMiddleware, rbac('super_admin', 'hr'), onboardingController.getOnboardingTasks);
router.post('/complete', authMiddleware, onboardingController.completeOnboarding);
router.put('/tasks/:taskId', authMiddleware, onboardingController.updateTaskStatus);
router.get('/summary', authMiddleware, rbac('super_admin', 'hr'), onboardingController.getOnboardingSummary);

module.exports = router;
