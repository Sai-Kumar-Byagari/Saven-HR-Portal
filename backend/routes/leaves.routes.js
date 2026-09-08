const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const leavesController = require('../controllers/leaves.controller');

router.post('/apply', authMiddleware, [
  body('leave_type').isIn(['casual_leave', 'sick_leave', 'earned_leave', 'maternity_paternity', 'compensatory_off', 'unpaid_leave', 'work_from_home']),
  body('from_date').isDate(),
  body('to_date').isDate(),
  body('reason').notEmpty().trim(),
], leavesController.applyLeave);

router.get('/my', authMiddleware, leavesController.getMyLeaves);
router.get('/my/balance', authMiddleware, leavesController.getMyLeaveBalance);
router.get('/pending', authMiddleware, rbac('super_admin', 'manager'), leavesController.getPendingLeaves);
router.put('/:id/action', authMiddleware, rbac('super_admin', 'manager'), leavesController.approveRejectLeave);
router.get('/management', authMiddleware, rbac('super_admin', 'hr', 'payroll'), leavesController.getAllLeavesManagement);
router.delete('/:id', authMiddleware, leavesController.cancelLeave);

module.exports = router;
