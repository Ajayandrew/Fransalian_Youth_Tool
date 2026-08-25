const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const { savePersistentStore } = require('../store/persistentStore');
const Member = require('../models/Member');

const calcAge = (dobString) => {
  if (!dobString) return 20;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 20;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const ensureMemberIds = (membersList, persist = false) => {
  if (!Array.isArray(membersList)) return [];
  const usedIds = new Set();
  let maxNum = 0;

  membersList.forEach(m => {
    if (m && m.memberId && String(m.memberId) !== 'undefined' && String(m.memberId).trim() !== '') {
      const strId = String(m.memberId).trim();
      usedIds.add(strId);
      const match = strId.match(/FY-MEM-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });

  let modified = false;
  let counter = 1;

  membersList.forEach(m => {
    if (!m) return;
    const strId = m.memberId !== undefined && m.memberId !== null ? String(m.memberId).trim() : '';
    if (!strId || strId === 'undefined') {
      let candidate = `FY-MEM-${String(counter).padStart(3, '0')}`;
      while (usedIds.has(candidate)) {
        counter++;
        candidate = `FY-MEM-${String(counter).padStart(3, '0')}`;
      }
      m.memberId = candidate;
      usedIds.add(candidate);
      if (counter > maxNum) maxNum = counter;
      counter++;
      modified = true;

      const memMatch = (memoryStore.members || []).find(sm => sm._id === m._id);
      if (memMatch && memMatch !== m) {
        memMatch.memberId = candidate;
      }

      if (!getIsInMemory() && m._id) {
        Member.findByIdAndUpdate(m._id, { memberId: candidate }).catch(() => {});
      }
    }
  });

  if (modified && persist) {
    try {
      savePersistentStore();
    } catch (e) {}
  }
  return membersList;
};

const generateNextMemberId = async () => {
  let dbMembers = [];
  if (!getIsInMemory()) {
    try {
      dbMembers = await Member.find({}).lean();
    } catch (e) {
      dbMembers = [];
    }
  }

  const memMembers = memoryStore.members || [];
  const combinedMembers = [...memMembers];
  dbMembers.forEach(dbM => {
    if (!combinedMembers.some(m => m._id === dbM._id)) {
      combinedMembers.push(dbM);
    }
  });

  ensureMemberIds(combinedMembers, true);

  const usedIds = new Set();
  let maxNum = 0;

  combinedMembers.forEach(m => {
    if (m && m.memberId && String(m.memberId) !== 'undefined' && String(m.memberId).trim() !== '') {
      const strId = String(m.memberId).trim();
      usedIds.add(strId);
      const match = strId.match(/FY-MEM-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });

  let counter = Math.max(combinedMembers.length + 1, maxNum + 1);
  let candidate = `FY-MEM-${String(counter).padStart(3, '0')}`;
  while (usedIds.has(candidate)) {
    counter++;
    candidate = `FY-MEM-${String(counter).padStart(3, '0')}`;
  }
  return candidate;
};

// Clean up any missing IDs in memory store on initialization
ensureMemberIds(memoryStore.members || [], true);

const getMembers = async (req, res) => {
  try {
    const { search, gender, anbiyam, activeStatus, bloodGroup } = req.query;
    let list = [];

    if (getIsInMemory()) {
      list = [...memoryStore.members];
    } else {
      const dbQuery = {};
      if (gender && gender !== 'All') dbQuery.gender = gender;
      if (anbiyam && anbiyam !== 'All') dbQuery.anbiyamName = anbiyam;
      if (activeStatus && activeStatus !== 'All') dbQuery.activeStatus = activeStatus;

      list = await Member.find(dbQuery).lean();
      if (list.length === 0 && memoryStore.members.length > 0 && Object.keys(dbQuery).length === 0) {
        // Sync persistent memoryStore items to MongoDB Atlas if DB was empty
        await Member.insertMany(memoryStore.members).catch(() => {});
        list = await Member.find({}).lean();
      }
    }

    list = ensureMemberIds(list, true);

    if (search) {
      const rawQ = search.trim().toLowerCase();
      const normQ = rawQ.replace(/\s+/g, '+');
      list = list.filter(m =>
        (m.memberId && m.memberId.toLowerCase().includes(rawQ)) ||
        (m.fullName && m.fullName.toLowerCase().includes(rawQ)) ||
        (m.baptismName && m.baptismName.toLowerCase().includes(rawQ)) ||
        (m.mobileNumber && m.mobileNumber.includes(rawQ)) ||
        (m.anbiyamName && m.anbiyamName.toLowerCase().includes(rawQ)) ||
        (m.bloodGroup && (
          m.bloodGroup.toLowerCase().includes(rawQ) ||
          m.bloodGroup.toLowerCase().replace(/\s+/g, '+').includes(normQ)
        ))
      );
    }

    if (getIsInMemory()) {
      if (gender && gender !== 'All') list = list.filter(m => m.gender === gender);
      if (anbiyam && anbiyam !== 'All') list = list.filter(m => m.anbiyamName === anbiyam);
      if (activeStatus && activeStatus !== 'All') list = list.filter(m => m.activeStatus === activeStatus);
    }

    if (bloodGroup) {
      const targetBg = bloodGroup.trim().replace(/\s+/g, '+').toUpperCase();
      list = list.filter(m => {
        if (!m.bloodGroup) return false;
        const memberBg = m.bloodGroup.trim().replace(/\s+/g, '+').toUpperCase();
        return memberBg === targetBg;
      });
    }

    return res.json({ success: true, count: list.length, members: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    let member = null;

    if (getIsInMemory()) {
      member = memoryStore.members.find(m => m._id === id);
    } else {
      member = await Member.findById(id);
    }

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    return res.json({ success: true, member });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const validateMemberInput = (data) => {
  if (!data.fullName || data.fullName.trim().length === 0) {
    return 'Full Name is required.';
  }
  if (data.fullName.trim().length > 50) {
    return 'Full Name cannot exceed 50 characters.';
  }
  if (data.baptismName && data.baptismName.trim().length > 50) {
    return 'Baptism Name cannot exceed 50 characters.';
  }
  if (!data.dob) {
    return 'Date of Birth is required.';
  }
  if (!data.mobileNumber || !/^\d{10}$/.test(data.mobileNumber.trim())) {
    return 'Mobile Number is mandatory and must be exactly 10 numeric digits.';
  }
  if (data.address && data.address.trim().length > 150) {
    return 'Address cannot exceed 150 characters.';
  }
  if (data.notes && data.notes.trim().length > 150) {
    return 'Notes cannot exceed 150 characters.';
  }
  return null;
};

const createMember = async (req, res) => {
  try {
    const data = req.body;
    const errMsg = validateMemberInput(data);
    if (errMsg) {
      return res.status(400).json({ success: false, message: errMsg });
    }

    data.age = calcAge(data.dob);
    if (!data.memberId || data.memberId === 'undefined' || String(data.memberId).trim() === '') {
      data.memberId = await generateNextMemberId();
    }

    delete data.photo;
    if (req.file) {
      data.photo = req.file.dataUrl || `/uploads/${req.file.filename}`;
    } else {
      data.photo = '';
    }

    let newMember = null;
    if (getIsInMemory()) {
      newMember = {
        _id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.members.unshift(newMember);
    } else {
      newMember = await Member.create(data);
      memoryStore.members.unshift(newMember.toObject ? newMember.toObject() : newMember);
    }
    savePersistentStore();

    return res.status(201).json({ success: true, member: newMember, message: 'Youth member registered successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    delete data._id;
    delete data.createdAt;
    delete data.__v;
    if (!data.memberId || data.memberId === 'undefined' || String(data.memberId).trim() === '') {
      delete data.memberId;
    }

    if (data.fullName || data.mobileNumber || data.address) {
      const errMsg = validateMemberInput({
        fullName: data.fullName || 'Member',
        dob: data.dob || '2000-01-01',
        mobileNumber: data.mobileNumber || '9876543210',
        ...data
      });
      if (errMsg) {
        return res.status(400).json({ success: false, message: errMsg });
      }
    }

    if (data.dob) {
      data.age = calcAge(data.dob);
    }
    data.updatedAt = new Date();

    delete data.photo;
    if (data.removePhoto === 'true' || data.removePhoto === true) {
      data.photo = '';
    } else if (req.file) {
      data.photo = req.file.dataUrl || `/uploads/${req.file.filename}`;
    } else {
      const existing = memoryStore.members.find(m => m._id === id);
      if (existing && existing.photo) {
        data.photo = existing.photo;
      }
    }

    let updatedMember = null;
    if (getIsInMemory()) {
      const idx = memoryStore.members.findIndex(m => m._id === id);
      if (idx !== -1) {
        memoryStore.members[idx] = { ...memoryStore.members[idx], ...data };
        updatedMember = memoryStore.members[idx];
      }
    } else {
      updatedMember = await Member.findByIdAndUpdate(id, data, { new: true });
      const idx = memoryStore.members.findIndex(m => m._id === id);
      if (idx !== -1 && updatedMember) {
        memoryStore.members[idx] = updatedMember.toObject ? updatedMember.toObject() : updatedMember;
      }
    }

    if (!updatedMember) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }
    savePersistentStore();

    return res.json({ success: true, member: updatedMember, message: 'Member profile updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsInMemory()) {
      memoryStore.members = memoryStore.members.filter(m => m._id !== id);
    } else {
      await Member.findByIdAndDelete(id);
      memoryStore.members = memoryStore.members.filter(m => m._id !== id);
    }
    savePersistentStore();

    return res.json({ success: true, message: 'Member record removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMembers, getMemberById, createMember, updateMember, deleteMember };
