const express = require('express');
const router = express.Router();
const { getAlbums, uploadPhotoToAlbum, deletePhoto } = require('../controllers/galleryController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authMiddleware, getAlbums);
router.post('/upload', authMiddleware, checkRole(['Admin', 'Youth Leader', 'Secretary']), upload.single('photo'), uploadPhotoToAlbum);
router.post('/delete-photo', authMiddleware, checkRole(['Admin', 'Youth Leader', 'Secretary']), deletePhoto);

module.exports = router;
