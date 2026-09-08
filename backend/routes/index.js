const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/documents', require('./documents.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/leaves', require('./leaves.routes'));
router.use('/holidays', require('./holidays.routes'));
router.use('/orgchart', require('./orgchart.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/recruitment', require('./recruitment.routes'));
router.use('/interviews', require('./interviews.routes'));
router.use('/voice', require('./voice.routes'));
router.use('/payroll', require('./payroll.routes'));
router.use('/resignation', require('./resignation.routes'));
router.use('/policies', require('./policies.routes'));
router.use('/onboarding', require('./onboarding.routes'));
router.use('/directory', require('./directory.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/teams', require('./teams.routes'));
router.use('/chat', require('./chat.routes'));
router.use('/employee-forms', require('./employeeForm.routes'));

module.exports = router;
