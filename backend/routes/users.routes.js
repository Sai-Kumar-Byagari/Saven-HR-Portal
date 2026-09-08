const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const auditLogger = require('../middleware/auditLogger');
const usersController = require('../controllers/users.controller');

// POST /api/users - Create employee (HR, Admin)
router.post('/', authMiddleware, rbac('super_admin', 'hr'), [
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('work_email').isEmail(),
  body('personal_email').optional().isEmail(),
  body('role').isIn(['super_admin', 'manager', 'hr', 'employee', 'it', 'payroll']),
  body('temporary_password').notEmpty().isLength({ min: 8 }),
], auditLogger('users', 'CREATE'), usersController.createEmployee);

// GET /api/users - All employees
router.get('/', authMiddleware, rbac('super_admin', 'hr'), usersController.getAllEmployees);

// GET /api/users/team - Manager's team
router.get('/team', authMiddleware, rbac('super_admin', 'manager', 'hr'), usersController.getTeamEmployees);

// GET /api/users/:id
router.get('/:id', authMiddleware, usersController.getEmployeeById);

// PUT /api/users/:id
router.put('/:id', authMiddleware, rbac('super_admin', 'hr'), auditLogger('users', 'UPDATE'), usersController.updateEmployee);

// DELETE /api/users/:id (soft deactivate)
router.delete('/:id', authMiddleware, rbac('super_admin'), auditLogger('users', 'DELETE'), usersController.deactivateEmployee);

// DELETE /api/users/:id/permanent (hard delete — removes all data)
router.delete('/:id/permanent', authMiddleware, rbac('super_admin', 'hr'), auditLogger('users', 'PERMANENT_DELETE'), usersController.permanentDeleteEmployee);

// PUT /api/users/:id/reset-password (Admin/HR resets employee password)
router.put('/:id/reset-password', authMiddleware, rbac('super_admin', 'hr'), [
  body('new_password').notEmpty().isLength({ min: 8 }),
], auditLogger('users', 'PASSWORD_RESET'), usersController.adminResetPassword);

module.exports = router;
