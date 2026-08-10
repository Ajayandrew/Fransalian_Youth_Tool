const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const Member = require('../models/Member');
const { Income, Expense } = require('../models/Finance');
const Subscription = require('../models/Subscription');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');

const getDashboardStats = async (req, res) => {
  try {
    let members = [], incomeList = [], expenseList = [], subs = [], events = [], attendance = [], secretOfferings = [];

    if (getIsInMemory()) {
      members = memoryStore.members || [];
      incomeList = memoryStore.income || [];
      expenseList = memoryStore.expense || [];
      subs = memoryStore.subscriptions || [];
      events = memoryStore.events || [];
      attendance = memoryStore.attendance || [];
      secretOfferings = memoryStore.secretOfferings || [];
    } else {
      [members, incomeList, expenseList, subs, events, attendance] = await Promise.all([
        Member.find({}).lean(),
        Income.find({}).lean(),
        Expense.find({}).lean(),
        Subscription.find({}).lean(),
        Event.find({}).lean(),
        Attendance.find({}).lean()
      ]);
      secretOfferings = memoryStore.secretOfferings || [];
    }

    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.activeStatus === 'Active').length;

    const totalSubsPaid = subs
      .filter(s => (s.status || '').toLowerCase() === 'paid')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalSecretOff = secretOfferings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const generalIncome = incomeList
      .filter(i => i.category !== 'Monthly Subscription' && i.source !== 'Monthly Subscription')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const totalIncome = generalIncome + totalSubsPaid + totalSecretOff;
    const totalExpense = expenseList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const currentBalance = totalIncome - totalExpense;

    const currentMonth = 'August 2026';
    const monthlySubscriptionCollection = subs
      .filter(s => s.status === 'Paid' && (s.month === currentMonth || !s.month))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Birthdays
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    const todayBirthdays = members.filter(m => {
      if (!m.dob) return false;
      const d = new Date(m.dob);
      return (d.getMonth() + 1) === todayMonth && d.getDate() === todayDay;
    });

    const upcomingBirthdays = members.filter(m => {
      if (!m.dob) return false;
      const d = new Date(m.dob);
      return (d.getMonth() + 1) === todayMonth;
    });

    // Upcoming Events
    const todayStr = today.toISOString().split('T')[0];
    const upcomingEvents = events.filter(e => e.date >= todayStr || e.status === 'Upcoming');

    // Charts Data
    const financialOverview = [
      { name: 'Total Income', amount: totalIncome },
      { name: 'Total Expenses', amount: totalExpense },
      { name: 'Net Balance', amount: currentBalance }
    ];

    // Calculate actual monthly subscription collections from real paid subscriptions
    const collectionsByMonth = {};
    subs.filter(s => s.status === 'Paid').forEach(s => {
      const m = s.month || 'Current';
      collectionsByMonth[m] = (collectionsByMonth[m] || 0) + (Number(s.amount) || 0);
    });

    const monthlyCollectionChart = Object.keys(collectionsByMonth).length > 0
      ? Object.keys(collectionsByMonth).map(month => ({ month, amount: collectionsByMonth[month] }))
      : [{ month: 'Current', amount: monthlySubscriptionCollection || 0 }];

    const attendanceOverview = attendance.slice(0, 5).map(att => {
      const total = att.records ? att.records.length : 0;
      const present = att.records ? att.records.filter(r => r.status === 'Present').length : 0;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        name: att.meetingName,
        attendancePct: pct
      };
    });

    return res.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        monthlySubscriptionCollection,
        totalSubsPaid,
        totalSecretOff,
        combinedCollections: totalSubsPaid + totalSecretOff,
        totalIncome,
        totalExpense,
        currentBalance,
        todayBirthdaysCount: todayBirthdays.length,
        upcomingEventsCount: upcomingEvents.length
      },
      charts: {
        financialOverview,
        monthlyCollectionChart,
        attendanceOverview
      },
      recentActivity: {
        newMembers: members.slice(0, 5),
        recentPayments: subs.slice(0, 5),
        todayBirthdays,
        upcomingBirthdays: upcomingBirthdays.slice(0, 5),
        upcomingEvents: upcomingEvents.slice(0, 5)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
