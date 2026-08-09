const express = require('express');
const router = express.Router();
const { login, me, changePassword, updateProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/change-password', authMiddleware, changePassword);
router.put('/update-profile', authMiddleware, updateProfile);

module.exports = router;
