const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { uploadDocument } = require('../middleware/upload');
const documentsController = require('../controllers/documents.controller');

router.post('/', authMiddleware, uploadDocument, documentsController.uploadDocument);
router.get('/', authMiddleware, documentsController.getMyDocuments);
router.get('/employee/:userId', authMiddleware, rbac('super_admin', 'hr', 'manager'), documentsController.getEmployeeDocuments);
router.delete('/:id', authMiddleware, documentsController.deleteDocument);

module.exports = router;
