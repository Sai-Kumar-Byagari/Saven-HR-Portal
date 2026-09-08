const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { uploadPayslipFile } = require('../middleware/upload');
const payrollController = require('../controllers/payroll.controller');

// Upload payslip by emp_id (admin/payroll only)
router.post('/upload', authMiddleware, rbac('super_admin', 'payroll'), uploadPayslipFile, payrollController.uploadPayslip);

// Employee: view own payslips
router.get('/my', authMiddleware, payrollController.getMyPayslips);

// Admin/Payroll: view all payslips
router.get('/all', authMiddleware, rbac('super_admin', 'payroll'), payrollController.getAllPayslips);

// View single payslip
router.get('/:id', authMiddleware, payrollController.getPayslipById);

module.exports = router;
