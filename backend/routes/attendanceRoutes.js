const express = require('express');
const router = express.Router();
const { getAttendance, recordAttendance } = require('../controllers/attendanceController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, getAttendance);
router.post('/', authMiddleware, checkRole(['Admin', 'Youth Leader', 'Secretary']), recordAttendance);

module.exports = router;
