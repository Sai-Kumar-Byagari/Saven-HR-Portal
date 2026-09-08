const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { uploadPolicyDoc } = require('../middleware/upload');
const auditLogger = require('../middleware/auditLogger');
const policiesController = require('../controllers/policies.controller');

router.post('/', authMiddleware, rbac('super_admin', 'hr'), uploadPolicyDoc, auditLogger('policies', 'CREATE'), policiesController.uploadPolicy);
router.get('/', authMiddleware, policiesController.getPolicies);
router.delete('/:id', authMiddleware, rbac('super_admin', 'hr'), auditLogger('policies', 'DELETE'), policiesController.deletePolicy);

module.exports = router;
