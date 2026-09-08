const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const c = require('../controllers/employeeForm.controller');

// Employee routes
router.get('/my',  auth, c.getMyForm);
router.post('/my', auth, c.saveForm);

// HR/Admin routes
router.get('/',          auth, rbac('super_admin','hr'), c.getAllForms);
router.get('/:id',       auth, rbac('super_admin','hr'), c.getFormById);
router.put('/:id/review', auth, rbac('super_admin','hr'), c.reviewForm);

module.exports = router;
