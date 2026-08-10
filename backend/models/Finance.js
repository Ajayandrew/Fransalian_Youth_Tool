const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Monthly Subscription', 'Donation', 'Offering', 'Sponsor', 'Meeting Secret Offering', 'Other'],
    default: 'Offering' 
  },
  source: { type: String, default: 'Offering' },
  receiptNumber: { type: String, default: '' },
  paymentMode: { type: String, default: 'Cash' },
  receiptImage: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

const expenseSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Food', 'Decoration', 'Travel', 'Charity', 'Sound System', 'Miscellaneous'],
    default: 'Miscellaneous' 
  },
  paymentMode: { type: String, default: 'Cash' },
  receiptNumber: { type: String, default: '' },
  receiptImage: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

incomeSchema.index({ date: -1 });
incomeSchema.index({ category: 1 });

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

const Income = mongoose.models.Income || mongoose.model('Income', incomeSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

module.exports = { Income, Expense };
