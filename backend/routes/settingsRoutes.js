const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, resetData, addAnbiyam } = require('../controllers/settingsController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authMiddleware, getSettings);
router.post('/', authMiddleware, checkRole(['Admin']), upload.single('churchLogo'), updateSettings);
router.post('/anbiyams', authMiddleware, checkRole(['Admin', 'Youth Leader', 'Secretary', 'Treasurer']), addAnbiyam);
router.post('/reset-data', authMiddleware, checkRole(['Admin', 'Treasurer', 'Secretary', 'Youth Leader']), resetData);

module.exports = router;
