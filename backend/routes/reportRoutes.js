const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, getReports);

module.exports = router;
