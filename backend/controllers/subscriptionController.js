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
        Member.find({}).select('_id fullName mobileNumber whatsappNumber phone').lean()
      ]);
    }

    const defaultSubsAmount = (memoryStore.settings?.subscriptionAmount) || 50;

    // Create lookup maps
    const normTargetMonth = targetMonth.trim().toLowerCase();
    const subMapByMemberId = new Map();
    const subMapByName = new Map();
    const allMemberPaidMonths = new Map(); // memberName -> Set of paid months

    for (let i = 0; i < subsList.length; i++) {
      const s = subsList[i];
      const sMonth = (s.month || '').trim().toLowerCase();
      const sName = (s.memberName || '').trim().toLowerCase();
      const sId = (s.memberId || '').toString();

      if (sMonth === normTargetMonth) {
        if (sId) subMapByMemberId.set(sId, s);
        if (sName) subMapByName.set(sName, s);
      }

      if ((s.status || '').toLowerCase() === 'paid' && s.month) {
        if (!allMemberPaidMonths.has(sName)) {
          allMemberPaidMonths.set(sName, new Set());
        }
        allMemberPaidMonths.get(sName).add(s.month.trim());
      }
    }

    // Map all members for the target month with O(1) Map lookup
    const memberSubMatrix = membersList.map(m => {
      const mIdStr = m._id ? m._id.toString() : '';
      const mNameNorm = m.fullName ? m.fullName.trim().toLowerCase() : '';

      const existing = subMapByMemberId.get(mIdStr) || subMapByName.get(mNameNorm);
      const isPaid = existing && (existing.status || '').toLowerCase() === 'paid';
      const paidMonthsList = Array.from(allMemberPaidMonths.get(mNameNorm) || []);

      return {
        _id: existing ? existing._id : `sub_temp_${m._id}`,
        memberId: m._id,
        memberName: m.fullName,
        phone: m.mobileNumber || m.whatsappNumber || m.phone || '',
        month: targetMonth,
        year: targetYear,
        amount: isPaid ? (Number(existing.amount) || defaultSubsAmount) : defaultSubsAmount,
        status: isPaid ? 'Paid' : 'Unpaid',
        paymentDate: isPaid ? existing.paymentDate : '-',
        paymentMode: isPaid ? (existing.paymentMode || 'Cash') : '-',
        remarks: isPaid ? existing.remarks : '',
        paidMonths: paidMonthsList
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

const getMemberSubscriptionHistory = async (req, res) => {
  try {
    const { memberName, memberId } = req.query;
    if (!memberName && !memberId) {
      return res.status(400).json({ success: false, message: 'Member name or ID required.' });
    }

    let subsList = [];
    if (getIsInMemory()) {
      subsList = memoryStore.subscriptions || [];
    } else {
      subsList = await Subscription.find({}).lean();
    }

    const cleanName = (memberName || '').trim().toLowerCase();
    const cleanId = (memberId || '').toString();

    const memberSubs = subsList.filter(s => {
      const sName = (s.memberName || '').trim().toLowerCase();
      const sId = (s.memberId || '').toString();
      return (cleanName && sName === cleanName) || (cleanId && sId === cleanId);
    });

    return res.json({
      success: true,
      subscriptions: memberSubs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markSubscriptionPaid = async (req, res) => {
  try {
    const { memberName, memberId, month, months, year, amount, paymentMode, remarks } = req.body;
    if (!memberName) {
      return res.status(400).json({ success: false, message: 'Member Name is required.' });
    }

    // Support single month or multi-month array
    let targetMonths = [];
    if (Array.isArray(months) && months.length > 0) {
      targetMonths = months.map(m => m.trim());
    } else if (month) {
      targetMonths = [month.trim()];
    } else {
      targetMonths = ['August 2026'];
    }

    const targetYear = year || new Date().getFullYear().toString();
    const totalFeeAmount = Number(amount) || (50 * targetMonths.length);
    const perMonthAmount = Math.round(totalFeeAmount / targetMonths.length);
    const currentDate = new Date().toISOString().split('T')[0];
    const cleanName = memberName.trim();
    const cleanId = memberId || 'mem_' + Date.now();
    const mode = paymentMode || 'Cash';
    const baseRemarks = remarks || 'Monthly Subscription Collected';

    const createdRecords = [];

    if (getIsInMemory()) {
      for (const m of targetMonths) {
        const monthYear = m.includes(' ') ? m.split(' ')[1] : targetYear;
        const record = {
          _id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          memberId: cleanId,
          memberName: cleanName,
          month: m,
          year: monthYear,
          amount: perMonthAmount,
          status: 'Paid',
          paymentDate: currentDate,
          paymentMode: mode,
          remarks: targetMonths.length > 1
            ? `${baseRemarks} (${targetMonths.length} months bulk payment)`
            : baseRemarks
        };

        memoryStore.subscriptions = (memoryStore.subscriptions || []).filter(s =>
          !(s.memberName && s.memberName.trim().toLowerCase() === cleanName.toLowerCase() && s.month.trim().toLowerCase() === m.toLowerCase())
        );
        memoryStore.subscriptions.unshift(record);
        createdRecords.push(record);
      }

      // Record consolidated income entry for today's collection
      const monthNamesStr = targetMonths.join(', ');
      memoryStore.income.unshift({
        _id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: `Monthly Subscription (₹${totalFeeAmount}): ${cleanName} (${monthNamesStr})`,
        amount: totalFeeAmount,
        date: currentDate,
        category: 'Monthly Subscription',
        source: 'Monthly Subscription',
        receiptNumber: `SUB-${Date.now().toString().slice(-6)}`,
        paymentMode: mode,
        notes: `Subscription payment for ${monthNamesStr}${targetMonths.length > 1 ? ` (${targetMonths.length} months)` : ''}`
      });
    } else {
      const { Income } = require('../models/Finance');

      for (const m of targetMonths) {
        const monthYear = m.includes(' ') ? m.split(' ')[1] : targetYear;
        const recData = {
          _id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          memberId: cleanId,
          memberName: cleanName,
          month: m,
          year: monthYear,
          amount: perMonthAmount,
          status: 'Paid',
          paymentDate: currentDate,
          paymentMode: mode,
          remarks: targetMonths.length > 1
            ? `${baseRemarks} (${targetMonths.length} months bulk payment)`
            : baseRemarks
        };

        const existingSub = await Subscription.findOne({
          memberName: { $regex: new RegExp(`^${cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
          month: { $regex: new RegExp(`^${m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        });

        if (existingSub) {
          existingSub.status = 'Paid';
          existingSub.amount = perMonthAmount;
          existingSub.paymentDate = currentDate;
          existingSub.paymentMode = mode;
          existingSub.remarks = recData.remarks;
          await existingSub.save();
          createdRecords.push(existingSub);
        } else {
          const created = await Subscription.create(recData);
          createdRecords.push(created);
        }
      }

      const monthNamesStr = targetMonths.join(', ');
      await Income.create({
        _id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: `Monthly Subscription (₹${totalFeeAmount}): ${cleanName} (${monthNamesStr})`,
        amount: totalFeeAmount,
        date: currentDate,
        category: 'Monthly Subscription',
        source: 'Monthly Subscription',
        receiptNumber: `SUB-${Date.now().toString().slice(-6)}`,
        paymentMode: mode,
        notes: `Subscription payment for ${monthNamesStr}${targetMonths.length > 1 ? ` (${targetMonths.length} months)` : ''}`
      });
    }

    savePersistentStore();

    const monthDisplay = targetMonths.length > 1 ? `${targetMonths.length} months (${targetMonths.join(', ')})` : targetMonths[0];
    return res.status(201).json({
      success: true,
      subscriptions: createdRecords,
      totalAmount: totalFeeAmount,
      months: targetMonths,
      message: `₹${totalFeeAmount} Subscription collected for ${cleanName} for ${monthDisplay}!`
    });
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
      const memberOrCond = [{ memberName: { $regex: new RegExp(`^${cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }];
      if (memberId) {
        memberOrCond.push({ memberId: memberId.toString() });
      }

      await Subscription.deleteMany({
        $and: [
          { $or: memberOrCond },
          {
            $or: [
              { month: { $regex: new RegExp(`^${targetMonth.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
              { month: { $exists: false } },
              { month: '' }
            ]
          }
        ]
      });

      const { Income } = require('../models/Finance');
      await Income.deleteMany({
        category: 'Monthly Subscription',
        title: { $regex: new RegExp(cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }
      });
    }
    savePersistentStore();

    return res.json({ success: true, message: `Subscription set to Unpaid for ${cleanName} (${targetMonth}).` });
  } catch (error) {
    console.error('Error marking subscription unpaid:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSubscriptions, getMemberSubscriptionHistory, markSubscriptionPaid, markSubscriptionUnpaid };

