const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Parish Priest', 'Treasurer', 'Youth Leader', 'Secretary', 'Youth Member'], 
    default: 'Youth Member' 
  },
  avatar: { type: String, default: '' },
  mobileNumber: { type: String, default: '' },
  bloodGroup: { type: String, default: 'O+' },
  activeStatus: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ role: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
