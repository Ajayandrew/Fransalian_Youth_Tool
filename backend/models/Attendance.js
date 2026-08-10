const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  memberId: { type: String, required: true },
  memberName: { type: String, required: true },
  status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
  remarks: { type: String, default: '' }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  meetingName: { type: String, required: true },
  date: { type: String, required: true },
  records: [attendanceRecordSchema],
  notes: { type: String, default: '' }
}, { timestamps: true });

attendanceSchema.index({ date: -1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
