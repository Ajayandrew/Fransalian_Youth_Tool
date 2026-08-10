const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const { savePersistentStore } = require('../store/persistentStore');
const Gallery = require('../models/Gallery');

const getAlbums = async (req, res) => {
  try {
    let albums = [];
    if (getIsInMemory()) {
      albums = memoryStore.albums || [];
    } else {
      albums = await Gallery.find({});
    }

    return res.json({ success: true, count: albums.length, albums });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const uploadPhotoToAlbum = async (req, res) => {
  try {
    const { albumTitle, category, caption } = req.body;
    let photoUrl = '';

    if (req.file) {
      photoUrl = req.file.dataUrl || `/uploads/${req.file.filename}`;
    } else if (req.body.photoUrl) {
      photoUrl = req.body.photoUrl;
    } else {
      return res.status(400).json({ success: false, message: 'Photo file or URL is required.' });
    }

    const title = albumTitle || 'Youth Event Album';
    const cat = category || 'General';

    if (getIsInMemory()) {
      let album = memoryStore.albums.find(a => a.albumTitle.toLowerCase() === title.toLowerCase());
      if (!album) {
        album = {
          _id: 'alb_' + Date.now(),
          albumTitle: title,
          category: cat,
          photos: []
        };
        memoryStore.albums.unshift(album);
      }
      album.photos.unshift({ url: photoUrl, caption: caption || title, uploadedAt: new Date() });
    } else {
      let album = await Gallery.findOne({ albumTitle: title });
      if (!album) {
        album = await Gallery.create({ albumTitle: title, category: cat, photos: [] });
      }
      album.photos.unshift({ url: photoUrl, caption: caption || title });
      await album.save();
    }
    savePersistentStore();

    return res.status(201).json({ success: true, message: 'Photo uploaded to album.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const { albumId, photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ success: false, message: 'Photo URL is required.' });
    }

    if (getIsInMemory()) {
      (memoryStore.albums || []).forEach(alb => {
        alb.photos = (alb.photos || []).filter(p => p.url !== photoUrl);
      });
    } else {
      if (albumId) {
        await Gallery.findByIdAndUpdate(albumId, { $pull: { photos: { url: photoUrl } } });
      } else {
        await Gallery.updateMany({}, { $pull: { photos: { url: photoUrl } } });
      }
    }
    savePersistentStore();

    return res.json({ success: true, message: 'Photo deleted from gallery.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAlbums, uploadPhotoToAlbum, deletePhoto };
