const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  eventName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, default: '10:00 AM' },
  venue: { type: String, default: 'Church Hall' },
  description: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  status: { type: String, enum: ['Upcoming', 'Completed'], default: 'Upcoming' }
}, { timestamps: true });

eventSchema.index({ date: -1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
