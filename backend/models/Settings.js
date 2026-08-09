const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'org_settings' },
  churchName: { type: String, default: 'St. Mary Cathedral Parish' },
  youthName: { type: String, default: 'Francisalian Youth Movement' },
  address: { type: String, default: '12 Cathedral Road' },
  city: { type: String, default: 'Chennai' },
  district: { type: String, default: 'Chennai' },
  state: { type: String, default: 'Tamil Nadu' },
  pincode: { type: String, default: '600004' },
  contactEmail: { type: String, default: 'youth@church.org' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  churchLogo: { type: String, default: '' },
  subscriptionAmount: { type: Number, default: 50 },
  darkMode: { type: Boolean, default: false },
  youtubeUrl: { type: String, default: '' },
  facebookUrl: { type: String, default: '' },
  instagramUrl: { type: String, default: '' },
  anbiyams: { type: [String], default: ['St. Francis Xavier Anbiyam', 'St. Antony Anbiyam', 'Mother Teresa Anbiyam', 'St. Jude Anbiyam'] }
}, { timestamps: true });

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
