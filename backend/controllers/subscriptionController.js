const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const { savePersistentStore } = require('../store/persistentStore');
const Subscription = require('../models/Subscription');

const getSubscriptions = async (req, res) => {
  try {
    const { month, year, search, status } = req.query;
    const targetMonth = month || 'August 2026';
    const targetYear = year || '2026';

    let subsList = [];
    let membersList = [];

    if (getIsInMemory()) {
      subsList = memoryStore.subscriptions || [];
      membersList = memoryStore.members || [];
    } else {
      const Member = require('../models/Member');
      [subsList, membersList] = await Promise.all([
        Subscription.find({}).lean(),
        Member.find({}).lean()
      ]);
    }

    const defaultSubsAmount = (memoryStore.settings?.subscriptionAmount) || 50;

    // Map all members for the target month
    const memberSubMatrix = membersList.map(m => {
      const existing = subsList.find(s =>
        ( (s.memberId && s.memberId.toString() === m._id.toString()) ||
          (s.memberName && s.memberName.trim().toLowerCase() === m.fullName.trim().toLowerCase()) ) &&
        (s.month && s.month.trim().toLowerCase() === targetMonth.trim().toLowerCase())
      );

      const isPaid = existing && (existing.status || '').toLowerCase() === 'paid';

      return {
        _id: existing ? existing._id : `sub_temp_${m._id}`,
        memberId: m._id,
        memberName: m.fullName,
        month: targetMonth,
        year: targetYear,
        amount: isPaid ? (Number(existing.amount) || defaultSubsAmount) : defaultSubsAmount,
        status: isPaid ? 'Paid' : 'Unpaid',
        paymentDate: isPaid ? existing.paymentDate : '-',
        paymentMode: isPaid ? (existing.paymentMode || 'Cash') : '-',
        remarks: isPaid ? existing.remarks : ''
      };
    });

    let filtered = memberSubMatrix;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => s.memberName.toLowerCase().includes(q));
    }
    if (status) {
      const st = status.toLowerCase();
      if (st === 'unpaid' || st === 'pending') {
        filtered = filtered.filter(s => s.status === 'Unpaid');
      } else if (st === 'paid') {
        filtered = filtered.filter(s => s.status === 'Paid');
      }
    }

    const totalMembers = memberSubMatrix.length;
    const paidCount = memberSubMatrix.filter(s => s.status === 'Paid').length;
    const pendingCount = totalMembers - paidCount;

    const expectedCollection = totalMembers * defaultSubsAmount;
    // ONLY sum amounts where status is explicitly Paid
    const totalCollected = memberSubMatrix
      .filter(s => s.status === 'Paid')
      .reduce((sum, s) => sum + (Number(s.amount) || defaultSubsAmount), 0);
    const pendingCollection = pendingCount * defaultSubsAmount;

    return res.json({
      success: true,
      selectedMonth: targetMonth,
      selectedYear: targetYear,
      defaultSubsAmount,
      summary: {
        totalMembers,
        paidCount,
        pendingCount,
        expectedCollection,
        totalCollected,
        pendingCollection
      },
      subscriptions: filtered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markSubscriptionPaid = async (req, res) => {
  try {
    const { memberName, memberId, month, year, amount, paymentMode, remarks } = req.body;
    if (!memberName) {
      return res.status(400).json({ success: false, message: 'Member Name is required.' });
    }

    const targetMonth = month || 'August 2026';
    const targetYear = year || '2026';
    const feeAmount = Number(amount) || 50;
    const currentDate = new Date().toISOString().split('T')[0];
    const cleanName = memberName.trim();

    const newRecord = {
      _id: 'sub_' + Date.now(),
      memberId: memberId || 'mem_' + Date.now(),
      memberName: cleanName,
      month: targetMonth,
      year: targetYear,
      amount: feeAmount,
      status: 'Paid',
      paymentDate: currentDate,
      paymentMode: paymentMode || 'Cash',
      remarks: remarks || '₹50 Monthly Subscription Collected'
    };

    if (getIsInMemory()) {
      memoryStore.subscriptions = (memoryStore.subscriptions || []).filter(s =>
        !(s.memberName && s.memberName.trim().toLowerCase() === cleanName.toLowerCase() && s.month === targetMonth)
      );
      memoryStore.subscriptions.unshift(newRecord);

      memoryStore.income = (memoryStore.income || []).filter(i =>
        !(i.notes?.includes(`Subscription payment for ${targetMonth}`) && i.title?.toLowerCase().includes(cleanName.toLowerCase()))
      );

      memoryStore.income.unshift({
        _id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: `Monthly Subscription (₹${feeAmount}): ${cleanName} (${targetMonth})`,
        amount: feeAmount,
        date: currentDate,
        category: 'Monthly Subscription',
        source: 'Monthly Subscription',
        receiptNumber: `SUB-${Date.now().toString().slice(-6)}`,
        paymentMode: paymentMode || 'Cash',
        notes: `Subscription payment for ${targetMonth}`
      });
    } else {
      const existingSub = await Subscription.findOne({
        memberName: { $regex: new RegExp(`^${cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
        month: targetMonth
      });
      if (existingSub) {
        existingSub.status = 'Paid';
        existingSub.amount = feeAmount;
        existingSub.paymentDate = currentDate;
        existingSub.paymentMode = paymentMode || 'Cash';
        existingSub.remarks = remarks || '₹50 Monthly Subscription Collected';
        await existingSub.save();
      } else {
        await Subscription.create(newRecord);
      }

      const { Income } = require('../models/Finance');
      await Income.deleteMany({
        category: 'Monthly Subscription',
        title: { $regex: new RegExp(cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }
      });

      await Income.create({
        _id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: `Monthly Subscription (₹${feeAmount}): ${cleanName} (${targetMonth})`,
        amount: feeAmount,
        date: currentDate,
        category: 'Monthly Subscription',
        source: 'Monthly Subscription',
        receiptNumber: `SUB-${Date.now().toString().slice(-6)}`,
        paymentMode: paymentMode || 'Cash',
        notes: `Subscription payment for ${targetMonth}`
      });
    }
    savePersistentStore();

    return res.status(201).json({ success: true, subscription: newRecord, message: `₹${feeAmount} Subscription collected for ${cleanName}!` });
  } catch (error) {
    console.error('Error marking subscription paid:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markSubscriptionUnpaid = async (req, res) => {
  try {
    const { memberName, memberId, month } = req.body;
    if (!memberName) {
      return res.status(400).json({ success: false, message: 'Member Name is required.' });
    }

    const targetMonth = month || 'August 2026';
    const targetMonthNorm = targetMonth.trim().toLowerCase();
    const cleanName = memberName.trim();
    const cleanNameNorm = cleanName.toLowerCase();

    if (getIsInMemory()) {
      // Remove all matching subscription records from memory (reverting to Unpaid)
      memoryStore.subscriptions = (memoryStore.subscriptions || []).filter(s => {
        const sName = (s.memberName || '').trim().toLowerCase();
        const sId = (s.memberId || '').toString();
        const sMonth = (s.month || '').trim().toLowerCase();
        
        const isMemberMatch = sName === cleanNameNorm || (memberId && sId === memberId.toString());
        const isMonthMatch = !sMonth || sMonth === targetMonthNorm;
        
        return !(isMemberMatch && isMonthMatch);
      });

      // Remove corresponding Monthly Subscription income entry from memory
      memoryStore.income = (memoryStore.income || []).filter(i => {
        const isSubscriptionIncome = (i.category === 'Monthly Subscription' || i.source === 'Monthly Subscription');
        const matchesMember = i.title && i.title.toLowerCase().includes(cleanNameNorm);
        const matchesMonth = (i.title && i.title.toLowerCase().includes(targetMonthNorm)) ||
                             (i.notes && i.notes.toLowerCase().includes(targetMonthNorm));
        
        if (isSubscriptionIncome && matchesMember && matchesMonth) {
          return false;
        }
        return true;
      });
    } else {
      await Subscription.deleteMany({
        $or: [
          { memberName: { $regex: new RegExp(`^${cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
          { memberId: memberId || 'nomatch' }
        ],
        $or: [
          { month: { $regex: new RegExp(`^${targetMonth.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
          { month: { $exists: false } },
          { month: '' }
        ]
      });

      const { Income } = require('../models/Finance');
      await Income.deleteMany({
        category: 'Monthly Subscription',
        title: { $regex: new RegExp(cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }
      });
    }
    savePersistentStore();

    return res.json({ success: true, message: `Subscription set to Unpaid for ${cleanName}.` });
  } catch (error) {
    console.error('Error marking subscription unpaid:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSubscriptions, markSubscriptionPaid, markSubscriptionUnpaid };
