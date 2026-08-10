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
        Income.find({}).lean(),
        Expense.find({}).lean(),
        Subscription.find({}).lean()
      ]);
      secretOfferings = memoryStore.secretOfferings || [];
    }

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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addIncome = async (req, res) => {
  try {
    const data = req.body;
    if (!data.title || !data.amount || !data.date) {
      return res.status(400).json({ success: false, message: 'Title, Amount, and Date are required.' });
    }

    data.receiptNumber = data.receiptNumber || `REC-INC-${Date.now().toString().slice(-6)}`;
    if (req.file) {
      data.receiptImage = req.file.dataUrl || `/uploads/${req.file.filename}`;
    }

    let newIncome;
    if (getIsInMemory()) {
      newIncome = { _id: 'inc_' + Date.now(), ...data, createdAt: new Date() };
      memoryStore.income.unshift(newIncome);
    } else {
      newIncome = await Income.create(data);
      memoryStore.income.unshift(newIncome.toObject ? newIncome.toObject() : newIncome);
    }
    savePersistentStore();

    return res.status(201).json({ success: true, income: newIncome, message: 'Income entry created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addExpense = async (req, res) => {
  try {
    const data = req.body;
    if (!data.title || !data.amount || !data.date) {
      return res.status(400).json({ success: false, message: 'Title, Amount, and Date are required.' });
    }

    data.receiptNumber = data.receiptNumber || `EXP-${Date.now().toString().slice(-6)}`;
    if (req.file) {
      data.receiptImage = req.file.dataUrl || `/uploads/${req.file.filename}`;
    }

    let newExpense;
    if (getIsInMemory()) {
      newExpense = { _id: 'exp_' + Date.now(), ...data, createdAt: new Date() };
      memoryStore.expense.unshift(newExpense);
    } else {
      newExpense = await Expense.create(data);
      memoryStore.expense.unshift(newExpense.toObject ? newExpense.toObject() : newExpense);
    }
    savePersistentStore();

    return res.status(201).json({ success: true, expense: newExpense, message: 'Expense entry recorded.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addSecretOffering = async (req, res) => {
  try {
    const data = req.body;
    if (!data.amount || !data.date) {
      return res.status(400).json({ success: false, message: 'Amount and Date are required.' });
    }

    const newSecretEntry = {
      _id: 'sec_' + Date.now(),
      title: data.title || 'Meeting Secret Box Offering Collection',
      meetingName: data.meetingName || 'Youth Meeting',
      date: data.date,
      amount: Number(data.amount),
      collectedBy: data.collectedBy || (req.user ? req.user.fullName : 'Parish Leader'),
      notes: data.notes || 'Anonymous secret box collection'
    };

    if (!memoryStore.secretOfferings) memoryStore.secretOfferings = [];
    memoryStore.secretOfferings.unshift(newSecretEntry);

    // Auto-record as Income
    memoryStore.income.unshift({
      _id: 'inc_' + Date.now(),
      title: `${newSecretEntry.title} (${newSecretEntry.meetingName})`,
      amount: newSecretEntry.amount,
      date: newSecretEntry.date,
      source: 'Meeting Secret Offering',
      category: 'Meeting Secret Offering',
      receiptNumber: `SEC-${Date.now().toString().slice(-6)}`,
      paymentMode: 'Anonymous Box',
      notes: newSecretEntry.notes
    });
    savePersistentStore();

    return res.status(201).json({ success: true, secretOffering: newSecretEntry, message: 'Secret box offering recorded.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsInMemory()) {
      memoryStore.income = (memoryStore.income || []).filter(i => i._id !== id);
    } else {
      await Income.findByIdAndDelete(id);
      memoryStore.income = (memoryStore.income || []).filter(i => i._id !== id);
    }
    savePersistentStore();
    return res.json({ success: true, message: 'Income record deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsInMemory()) {
      memoryStore.expense = (memoryStore.expense || []).filter(e => e._id !== id);
    } else {
      await Expense.findByIdAndDelete(id);
      memoryStore.expense = (memoryStore.expense || []).filter(e => e._id !== id);
    }
    savePersistentStore();
    return res.json({ success: true, message: 'Expense record deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getFinanceSummary, addIncome, addExpense, addSecretOffering, deleteIncome, deleteExpense };
