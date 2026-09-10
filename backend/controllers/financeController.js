const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const { savePersistentStore } = require('../store/persistentStore');
const { Income, Expense } = require('../models/Finance');

const getFinanceSummary = async (req, res) => {
  try {
    let incomeList = [], expenseList = [], secretOfferings = [], subscriptions = [];

    if (getIsInMemory()) {
      incomeList = memoryStore.income || [];
      expenseList = memoryStore.expense || [];
      secretOfferings = memoryStore.secretOfferings || [];
      subscriptions = memoryStore.subscriptions || [];
    } else {
      const Subscription = require('../models/Subscription');
      [incomeList, expenseList, subscriptions] = await Promise.all([
        Income.find({}).sort({ date: -1, createdAt: -1 }).lean(),
        Expense.find({}).sort({ date: -1, createdAt: -1 }).lean(),
        Subscription.find({}).select('amount status').lean()
      ]);
      secretOfferings = memoryStore.secretOfferings || [];
    }

    // General income includes all manually logged income entries 
    // (excluding subscriptions which come from Subscriptions table and meeting secret offerings which come from secretOfferings)
    const generalIncome = incomeList
      .filter(i =>
        i.category !== 'Monthly Subscription' &&
        i.source !== 'Monthly Subscription' &&
        i.category !== 'Meeting Secret Offering' &&
        i.source !== 'Meeting Secret Offering'
      )
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const totalSecretCollection = secretOfferings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalMonthlySubscriptions = subscriptions
      .filter(s => (s.status || '').toLowerCase() === 'paid')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const totalIncome = generalIncome + totalMonthlySubscriptions + totalSecretCollection;
    const totalExpense = expenseList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const runningBalance = totalIncome - totalExpense;

    return res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        runningBalance,
        totalSecretCollection,
        totalMonthlySubscriptions
      },
      incomeList,
      expenseList,
      secretOfferings
    });
  } catch (error) {
    console.error('[Finance Summary Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addIncome = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.title || !data.amount || !data.date) {
      return res.status(400).json({ success: false, message: 'Title, Amount, and Date are required.' });
    }

    const numericAmount = Number(data.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid positive amount.' });
    }
    data.amount = numericAmount;

    data.title = data.title.trim();
    data.notes = data.notes || data.remarks || '';
    data.category = (data.category && data.category.trim()) || 'Donation';
    data.source = data.source || data.category || 'General';
    data.paymentMode = data.paymentMode || 'Cash';
    data.receiptNumber = data.receiptNumber || `REC-INC-${Date.now().toString().slice(-6)}`;
    if (req.file) {
      data.receiptImage = req.file.dataUrl || `/uploads/${req.file.filename}`;
    }

    let newIncome;
    if (getIsInMemory()) {
      newIncome = { 
        _id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7), 
        ...data, 
        createdAt: new Date() 
      };
      if (!memoryStore.income) memoryStore.income = [];
      memoryStore.income.unshift(newIncome);
    } else {
      newIncome = await Income.create(data);
      const plainObj = newIncome.toObject ? newIncome.toObject() : newIncome;
      if (!memoryStore.income) memoryStore.income = [];
      memoryStore.income.unshift(plainObj);
    }
    savePersistentStore();

    return res.status(201).json({ success: true, income: newIncome, message: 'Income entry recorded successfully.' });
  } catch (error) {
    console.error('[Add Income Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addExpense = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.title || !data.amount || !data.date) {
      return res.status(400).json({ success: false, message: 'Title, Amount, and Date are required.' });
    }

    const numericAmount = Number(data.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid positive amount.' });
    }
    data.amount = numericAmount;

    data.title = data.title.trim();
    data.notes = data.notes || data.remarks || '';
    data.category = (data.category && data.category.trim()) || 'Miscellaneous';
    data.paymentMode = data.paymentMode || 'Cash';
    data.receiptNumber = data.receiptNumber || `EXP-${Date.now().toString().slice(-6)}`;
    if (req.file) {
      data.receiptImage = req.file.dataUrl || `/uploads/${req.file.filename}`;
    }

    let newExpense;
    if (getIsInMemory()) {
      newExpense = { 
        _id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7), 
        ...data, 
        createdAt: new Date() 
      };
      if (!memoryStore.expense) memoryStore.expense = [];
      memoryStore.expense.unshift(newExpense);
    } else {
      newExpense = await Expense.create(data);
      const plainObj = newExpense.toObject ? newExpense.toObject() : newExpense;
      if (!memoryStore.expense) memoryStore.expense = [];
      memoryStore.expense.unshift(plainObj);
    }
    savePersistentStore();

    return res.status(201).json({ success: true, expense: newExpense, message: 'Expense entry recorded successfully.' });
  } catch (error) {
    console.error('[Add Expense Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addSecretOffering = async (req, res) => {
  try {
    const data = req.body;
    if (!data.amount || !data.date) {
      return res.status(400).json({ success: false, message: 'Amount and Date are required.' });
    }

    const numericAmount = Number(data.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid positive amount.' });
    }

    const entryId = 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newSecretEntry = {
      _id: entryId,
      title: data.title || 'Meeting Secret Box Offering Collection',
      meetingName: data.meetingName || 'Youth Meeting',
      date: data.date,
      amount: numericAmount,
      collectedBy: data.collectedBy || (req.user ? req.user.fullName : 'Parish Leader'),
      notes: data.notes || data.remarks || 'Anonymous secret box collection'
    };

    if (!memoryStore.secretOfferings) memoryStore.secretOfferings = [];
    memoryStore.secretOfferings.unshift(newSecretEntry);

    // Save as persistent Income record mirror
    const incomeDoc = {
      _id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: `${newSecretEntry.title} (${newSecretEntry.meetingName})`,
      amount: newSecretEntry.amount,
      date: newSecretEntry.date,
      source: 'Meeting Secret Offering',
      category: 'Meeting Secret Offering',
      receiptNumber: `SEC-${Date.now().toString().slice(-6)}`,
      paymentMode: 'Anonymous Box',
      notes: newSecretEntry.notes
    };

    if (getIsInMemory()) {
      if (!memoryStore.income) memoryStore.income = [];
      memoryStore.income.unshift(incomeDoc);
    } else {
      try {
        await Income.create(incomeDoc);
      } catch (e) {
        console.warn('Failed to mirror secret offering to Income collection:', e.message);
      }
      if (!memoryStore.income) memoryStore.income = [];
      memoryStore.income.unshift(incomeDoc);
    }
    savePersistentStore();

    return res.status(201).json({ success: true, secretOffering: newSecretEntry, message: 'Secret box offering recorded.' });
  } catch (error) {
    console.error('[Add Secret Offering Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsInMemory()) {
      memoryStore.income = (memoryStore.income || []).filter(i => i._id !== id);
    } else {
      await Income.deleteOne({ _id: id });
      memoryStore.income = (memoryStore.income || []).filter(i => i._id !== id);
    }
    savePersistentStore();
    return res.json({ success: true, message: 'Income record deleted.' });
  } catch (error) {
    console.error('[Delete Income Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsInMemory()) {
      memoryStore.expense = (memoryStore.expense || []).filter(e => e._id !== id);
    } else {
      await Expense.deleteOne({ _id: id });
      memoryStore.expense = (memoryStore.expense || []).filter(e => e._id !== id);
    }
    savePersistentStore();
    return res.json({ success: true, message: 'Expense record deleted.' });
  } catch (error) {
    console.error('[Delete Expense Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSecretOffering = async (req, res) => {
  try {
    const { id } = req.params;
    memoryStore.secretOfferings = (memoryStore.secretOfferings || []).filter(s => s._id !== id);
    if (!getIsInMemory()) {
      await Income.deleteMany({ $or: [{ _id: id }, { notes: { $regex: id } }] });
    }
    savePersistentStore();
    return res.json({ success: true, message: 'Secret offering record deleted.' });
  } catch (error) {
    console.error('[Delete Secret Offering Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getFinanceSummary, 
  addIncome, 
  addExpense, 
  addSecretOffering, 
  deleteIncome, 
  deleteExpense,
  deleteSecretOffering 
};
