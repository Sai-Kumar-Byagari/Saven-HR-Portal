const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const holidaysController = require('../controllers/holidays.controller');

router.get('/', authMiddleware, holidaysController.getHolidays);
router.post('/', authMiddleware, rbac('super_admin', 'hr'), [
  body('date').isDate(),
  body('name').notEmpty().trim(),
  body('type').isIn(['national', 'festival', 'optional']),
], holidaysController.createHoliday);
router.put('/:id', authMiddleware, rbac('super_admin', 'hr'), holidaysController.updateHoliday);
router.delete('/:id', authMiddleware, rbac('super_admin', 'hr'), holidaysController.deleteHoliday);

module.exports = router;
