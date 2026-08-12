const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const { savePersistentStore } = require('../store/persistentStore');
const Attendance = require('../models/Attendance');

const getAttendance = async (req, res) => {
  try {
    let list = [];
    if (getIsInMemory()) {
      list = memoryStore.attendance || [];
    } else {
      list = await Attendance.find({}).sort({ date: -1, createdAt: -1 }).lean();
    }

    return res.json({ success: true, count: list.length, attendance: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const recordAttendance = async (req, res) => {
  try {
    const { meetingName, date, meetingDate, records, notes } = req.body;
    const targetDate = date || meetingDate || new Date().toISOString().split('T')[0];

    if (!meetingName || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Meeting Name and Attendance Records are required.' });
    }

    const newAttendance = {
      _id: 'att_' + Date.now(),
      meetingName: meetingName.trim(),
      date: targetDate,
      records: records.map(r => ({
        memberId: r.memberId || r._id,
        memberName: r.memberName || r.fullName || 'Member',
        status: r.status || 'Present',
        remarks: r.remarks || ''
      })),
      notes: (notes || '').trim()
    };

    if (getIsInMemory()) {
      if (!memoryStore.attendance) memoryStore.attendance = [];
      memoryStore.attendance.unshift(newAttendance);
    } else {
      await Attendance.create(newAttendance);
      if (!memoryStore.attendance) memoryStore.attendance = [];
      memoryStore.attendance.unshift(newAttendance);
    }
    savePersistentStore();

    return res.status(201).json({ success: true, attendance: newAttendance, message: 'Meeting attendance recorded successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsInMemory()) {
      memoryStore.attendance = (memoryStore.attendance || []).filter(a => a._id !== id);
    } else {
      await Attendance.findByIdAndDelete(id);
      memoryStore.attendance = (memoryStore.attendance || []).filter(a => a._id !== id);
    }
    savePersistentStore();

    return res.json({ success: true, message: 'Attendance record removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAttendance, recordAttendance, deleteAttendance };
