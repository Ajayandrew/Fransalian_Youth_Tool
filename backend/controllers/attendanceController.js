const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const Attendance = require('../models/Attendance');

const getAttendance = async (req, res) => {
  try {
    let list = [];
    if (getIsInMemory()) {
      list = memoryStore.attendance || [];
    } else {
      list = await Attendance.find({});
    }

    return res.json({ success: true, count: list.length, attendance: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const recordAttendance = async (req, res) => {
  try {
    const { meetingName, date, records, notes } = req.body;
    if (!meetingName || !date || !records) {
      return res.status(400).json({ success: false, message: 'Meeting Name, Date, and Attendance Records are required.' });
    }

    const newAttendance = {
      _id: 'att_' + Date.now(),
      meetingName,
      date,
      records,
      notes: notes || ''
    };

    if (getIsInMemory()) {
      memoryStore.attendance.unshift(newAttendance);
    } else {
      await Attendance.create(newAttendance);
    }

    return res.status(201).json({ success: true, attendance: newAttendance, message: 'Meeting attendance recorded.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAttendance, recordAttendance };
