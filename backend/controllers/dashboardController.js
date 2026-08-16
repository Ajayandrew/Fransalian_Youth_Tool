const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const Member = require('../models/Member');
const { Income, Expense } = require('../models/Finance');
const Subscription = require('../models/Subscription');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');

let cachedDashboardResult = null;
let cachedDashboardTime = 0;
const DASHBOARD_CACHE_TTL_MS = 5000; // 5 seconds cache

const getDashboardStats = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedDashboardResult && (now - cachedDashboardTime < DASHBOARD_CACHE_TTL_MS) && !req.query.force) {
      return res.json(cachedDashboardResult);
    }
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
        Member.find({}).select('_id memberId fullName dob activeStatus role anbiyamName photo mobileNumber email').lean(),
        Income.find({}).select('amount category source').lean(),
        Expense.find({}).select('amount').lean(),
        Subscription.find({}).select('amount status month').lean(),
        Event.find({}).select('_id eventName date time venue status').lean(),
        Attendance.find({}).select('meetingName records').lean()
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

    // Key Leadership Team Construction
    let currentSettings = memoryStore.settings || {};
    if (!getIsInMemory()) {
      try {
        const SettingsModel = require('../models/Settings');
        const dbSettings = await SettingsModel.findById('org_settings').lean();
        if (dbSettings) currentSettings = { ...currentSettings, ...dbSettings };
      } catch (err) {}
    }

    const priestMember = members.find(m => m.role === 'Parish Priest') || 
                         members.find(m => m.role === 'Admin' && /father|priest|rev/i.test(m.fullName));
    const leaderMember = members.find(m => m.role === 'Youth Leader');
    const secretaryMember = members.find(m => m.role === 'Secretary');
    const treasurerMember = members.find(m => m.role === 'Treasurer');

    const leadership = [
      {
        id: priestMember?._id || 'priest_default',
        roleKey: 'priest',
        roleTitle: 'Parish Priest',
        subTitle: currentSettings.parishPriestTitle || 'Parish Priest / Spiritual Director',
        fullName: priestMember?.fullName || currentSettings.parishPriestName || 'Rev. Fr. Parish Priest',
        photo: priestMember?.photo || currentSettings.parishPriestPhoto || '',
        mobileNumber: priestMember?.mobileNumber || currentSettings.parishPriestPhone || currentSettings.contactPhone || '',
        email: priestMember?.email || currentSettings.contactEmail || '',
        anbiyamName: priestMember?.anbiyamName || currentSettings.churchName || 'Cathedral Parish'
      },
      {
        id: leaderMember?._id || 'leader_default',
        roleKey: 'leader',
        roleTitle: 'Youth Leader',
        subTitle: 'President / Youth Leader',
        fullName: leaderMember?.fullName || 'Youth Leader',
        photo: leaderMember?.photo || '',
        mobileNumber: leaderMember?.mobileNumber || '',
        email: leaderMember?.email || '',
        anbiyamName: leaderMember?.anbiyamName || 'Youth Executive'
      },
      {
        id: secretaryMember?._id || 'secretary_default',
        roleKey: 'secretary',
        roleTitle: 'Secretary',
        subTitle: 'Youth Secretary',
        fullName: secretaryMember?.fullName || 'Secretary',
        photo: secretaryMember?.photo || '',
        mobileNumber: secretaryMember?.mobileNumber || '',
        email: secretaryMember?.email || '',
        anbiyamName: secretaryMember?.anbiyamName || 'Youth Executive'
      },
      {
        id: treasurerMember?._id || 'treasurer_default',
        roleKey: 'treasurer',
        roleTitle: 'Treasurer',
        subTitle: 'Youth Treasurer',
        fullName: treasurerMember?.fullName || 'Treasurer',
        photo: treasurerMember?.photo || '',
        mobileNumber: treasurerMember?.mobileNumber || '',
        email: treasurerMember?.email || '',
        anbiyamName: treasurerMember?.anbiyamName || 'Youth Executive'
      }
    ];

    const responsePayload = {
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
      leadership,
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
    };

    cachedDashboardResult = responsePayload;
    cachedDashboardTime = Date.now();

    return res.json(responsePayload);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
