const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const directoryController = require('../controllers/directory.controller');

router.get('/', authMiddleware, directoryController.getDirectory);

module.exports = router;
