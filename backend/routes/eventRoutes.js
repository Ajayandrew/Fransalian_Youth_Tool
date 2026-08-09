const express = require('express');
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const allowedRoles = ['Admin', 'Youth Leader', 'Treasurer', 'Secretary'];

router.get('/', authMiddleware, getEvents);
router.post('/', authMiddleware, checkRole(allowedRoles), upload.single('bannerImage'), createEvent);
router.put('/:id', authMiddleware, checkRole(allowedRoles), upload.single('bannerImage'), updateEvent);
router.delete('/:id', authMiddleware, checkRole(allowedRoles), deleteEvent);

module.exports = router;
