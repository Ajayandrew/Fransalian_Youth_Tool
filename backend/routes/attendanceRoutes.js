const express = require('express');
const router = express.Router();
const { getAttendance, recordAttendance, deleteAttendance } = require('../controllers/attendanceController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, getAttendance);
router.post('/', authMiddleware, checkRole(['Admin', 'Treasurer', 'Youth Leader', 'Secretary']), recordAttendance);
router.delete('/:id', authMiddleware, checkRole(['Admin', 'Treasurer', 'Youth Leader', 'Secretary']), deleteAttendance);

module.exports = router;
