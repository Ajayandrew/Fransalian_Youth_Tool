const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  memberId: { type: String, default: '' },
  fullName: { type: String, required: true, maxlength: 50 },
  baptismName: { type: String, default: '', maxlength: 50 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  dob: { type: String, required: true },
  age: { type: Number, default: 0 },
  mobileNumber: { type: String, required: true, match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits'] },
  whatsappNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '', maxlength: 150 },
  city: { type: String, default: 'Chennai' },
  district: { type: String, default: 'Chennai' },
  state: { type: String, default: 'Tamil Nadu' },
  pincode: { type: String, default: '600004' },
  occupation: { type: String, default: '' },
  bloodGroup: { type: String, default: 'O+' },
  anbiyamName: { type: String, default: 'Sagaya Madha Anbiyam' },
  parish: { type: String, default: 'St. Mary Cathedral' },
  joinedYouthDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  activeStatus: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  role: { 
    type: String, 
    enum: ['Admin', 'Youth Leader', 'Treasurer', 'Secretary', 'Vice President', 'Joint Secretary', 'Youth Member'], 
    default: 'Youth Member' 
  },
  photo: { type: String, default: '' },
  fatherName: { type: String, default: '', maxlength: 50 },
  motherName: { type: String, default: '', maxlength: 50 },
  emergencyContact: { type: String, default: '', maxlength: 50 },
  emergencyContactNumber: { type: String, default: '' },
  notes: { type: String, default: '', maxlength: 150 }
}, { timestamps: true });

memberSchema.index({ memberId: 1 });
memberSchema.index({ fullName: 1 });
memberSchema.index({ activeStatus: 1 });
memberSchema.index({ anbiyamName: 1 });
memberSchema.index({ gender: 1 });

module.exports = mongoose.models.Member || mongoose.model('Member', memberSchema);
