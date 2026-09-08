const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const orgchartController = require('../controllers/orgchart.controller');

router.get('/', authMiddleware, orgchartController.getOrgChart);

module.exports = router;
