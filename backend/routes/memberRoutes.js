const express = require('express');
const router = express.Router();
const { getMembers, getMemberById, createMember, updateMember, deleteMember } = require('../controllers/memberController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authMiddleware, getMembers);
router.get('/:id', authMiddleware, getMemberById);
router.post('/', authMiddleware, checkRole(['Admin', 'Treasurer', 'Youth Leader', 'Secretary']), upload.single('photo'), createMember);
router.put('/:id', authMiddleware, checkRole(['Admin', 'Treasurer', 'Youth Leader', 'Secretary']), upload.single('photo'), updateMember);
router.delete('/:id', authMiddleware, checkRole(['Admin']), deleteMember);

module.exports = router;
