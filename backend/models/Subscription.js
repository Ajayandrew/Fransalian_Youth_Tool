const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  memberId: { type: String, default: '' },
  memberName: { type: String, required: true },
  month: { type: String, required: true }, // e.g. "August 2026"
  year: { type: String, required: true },  // e.g. "2026"
  amount: { type: Number, default: 50 },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
  paymentDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  paymentMode: { type: String, default: 'Cash' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
