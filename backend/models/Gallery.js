const mongoose = require('mongoose');

const photoItemSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const galleryAlbumSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'alb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  albumTitle: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Youth Meeting', 'Retreat', 'Christmas', 'Camp', 'Sports', 'Feast', 'Spiritual', 'Cultural', 'Choir', 'General'],
    default: 'General'
  },
  description: { type: String, default: '' },
  photos: [photoItemSchema]
}, { timestamps: true });

module.exports = mongoose.models.Gallery || mongoose.model('Gallery', galleryAlbumSchema);
