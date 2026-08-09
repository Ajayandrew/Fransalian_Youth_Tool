const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const Member = require('../models/Member');
const { Income, Expense } = require('../models/Finance');
const Subscription = require('../models/Subscription');

const getReports = async (req, res) => {
  try {
    let members = [], incomeList = [], expenseList = [], subs = [], attendance = [], secretOfferings = [];

    if (getIsInMemory()) {
      members = memoryStore.members || [];
      incomeList = memoryStore.income || [];
      expenseList = memoryStore.expense || [];
      subs = memoryStore.subscriptions || [];
      attendance = memoryStore.attendance || [];
      secretOfferings = memoryStore.secretOfferings || [];
    } else {
      members = await Member.find({});
      incomeList = await Income.find({});
      expenseList = await Expense.find({});
      subs = await Subscription.find({});
      const Attendance = require('../models/Attendance');
      attendance = await Attendance.find({});
      secretOfferings = memoryStore.secretOfferings || [];
    }

    return res.json({
      success: true,
      reports: {
        members,
        incomeList,
        expenseList,
        subscriptions: subs,
        attendance,
        secretOfferings
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReports };
