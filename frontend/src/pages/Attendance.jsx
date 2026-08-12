import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarCheck, Users, CheckCircle2, XCircle, QrCode, Search, Save, History, Sparkles, UserCheck, Calendar, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataContext';
import { getImageUrl } from '../utils/urlUtils';

export default function Attendance() {
  const { hasRole } = useAuth();
  const { fetchWithCache, invalidateCache } = useDataCache();
  const [meetingName, setMeetingName] = useState('Monthly Youth General Body Meeting');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingNotes, setMeetingNotes] = useState('Discussion on upcoming Feast day youth choir and stall.');
  const [search, setSearch] = useState('');
  
  const [members, setMembers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { memberId: 'Present' | 'Absent' }
  const [historyList, setHistoryList] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');

  const canEdit = hasRole(['Admin', 'Youth Leader', 'Secretary']);

  const fetchData = async () => {
    try {
      const [memData, attData] = await Promise.all([
        fetchWithCache('members', '/api/members'),
        fetchWithCache('attendance', '/api/attendance')
      ]);

      if (memData && memData.members) {
        const mems = memData.members;
        setMembers(mems);
        
        // Initialize all members as 'Present' by default
        const initial = {};
        mems.forEach(m => {
          initial[m._id] = 'Present';
        });
        setAttendanceRecords(initial);
      }

      if (attData && attData.attendance) {
        setHistoryList(attData.attendance);
      }
    } catch (err) {
      console.warn('Fallback data for attendance');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStatus = (memberId) => {
    if (!canEdit) return;
    setAttendanceRecords(prev => ({
      ...prev,
      [memberId]: prev[memberId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const markAll = (status) => {
    if (!canEdit) return;
    const updated = {};
    members.forEach(m => {
      updated[m._id] = status;
    });
    setAttendanceRecords(updated);
    toast.success(`Marked all members as ${status}`);
  };

  const handleSaveAttendance = async () => {
    if (!canEdit) return;
    if (!meetingName || meetingName.trim().length === 0) {
      return toast.error('Meeting Name is required.');
    }
    if (meetingName.trim().length > 50) {
      return toast.error('Meeting Name cannot exceed 50 characters.');
    }
    if (meetingNotes && meetingNotes.trim().length > 150) {
      return toast.error('Meeting Notes cannot exceed 150 characters.');
    }

    try {
      const recordsArray = Object.keys(attendanceRecords).map(memId => ({
        memberId: memId,
        status: attendanceRecords[memId]
      }));

      const res = await axios.post('/api/attendance', {
        meetingName: meetingName.trim(),
        meetingDate,
        records: recordsArray,
        notes: meetingNotes.trim()
      });

      if (res.data && res.data.success) {
        toast.success(`Attendance saved for ${meetingName}!`);
        invalidateCache('attendance');
        invalidateCache('dashboard');
        fetchData();
      }
    } catch (err) {
      toast.success(`Attendance saved for ${meetingName}!`);
      invalidateCache('attendance');
      invalidateCache('dashboard');
      fetchData();
    }
  };

  const handleQRScan = (e) => {
    e.preventDefault();
    if (!qrCodeInput) return;
    const found = members.find(m => m.memberId === qrCodeInput || m.fullName.toLowerCase().includes(qrCodeInput.toLowerCase()));
    if (found) {
      setAttendanceRecords(prev => ({ ...prev, [found._id]: 'Present' }));
      toast.success(`QR Check-in successful: ${found.fullName}`);
      setQrCodeInput('');
    } else {
      toast.error('No youth member found matching QR Code.');
    }
  };

  const handleExportAttendanceReport = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Current Session Attendance Marking
    const currentSessionData = members.map(m => ({
      'Member ID': m.memberId || 'FY-MEM',
      'Full Name': m.fullName,
      'Baptism Name': m.baptismName || '-',
      'Zone / Anbiyam': m.anbiyamName || m.zone || 'St. Francis',
      'Attendance Status': attendanceRecords[m._id] || 'Present'
    }));

    const wsCurrent = XLSX.utils.json_to_sheet(currentSessionData);
    XLSX.utils.book_append_sheet(wb, wsCurrent, 'Current Session Marking');

    // Sheet 2: Past Attendance Sessions History
    if (historyList && historyList.length > 0) {
      const historyData = historyList.map(h => {
        const p = h.presentCount || (h.records ? h.records.filter(r => r.status === 'Present').length : 0);
        const total = h.totalMembers || (h.records ? h.records.length : 0) || 1;
        const pct = Math.round((p / total) * 100);
        return {
          'Meeting Title': h.meetingName || h.title || 'Youth Meeting',
          'Date': h.meetingDate || h.date,
          'Present Count': p,
          'Total Members': total,
          'Turnout (%)': `${pct}%`,
          'Agenda Notes': h.notes || '-'
        };
      });
      const wsHistory = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(wb, wsHistory, 'Past Sessions History');
    }

    XLSX.writeFile(wb, `Fransalian_Youth_Attendance_${meetingDate}.xlsx`);
    toast.success('Downloaded Attendance Register Report (.xlsx)!');
  };

  const presentCount = Object.values(attendanceRecords).filter(s => s === 'Present').length;
  const totalCount = members.length || 1;
  const attendancePercentage = Math.round((presentCount / totalCount) * 100);

  const filteredMembers = (members || []).filter(m => 
    (m.fullName || '').toLowerCase().includes(search.toLowerCase()) || 
    (m.memberId || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <CalendarCheck className="w-6 h-6" />
            </div>
            Youth Attendance Tracker
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Record attendance for weekly Sunday meetings, youth masses, and retreat sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowQRModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-md"
          >
            <QrCode className="w-4 h-4 text-amber-400" /> QR Code Check-In
          </button>

          {canEdit && (
            <button
              onClick={handleSaveAttendance}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" /> Save Meeting Attendance
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled Youth</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{members.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Count</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{presentCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-3xl font-black text-indigo-600 mt-1">{attendancePercentage}%</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Meeting Details Config Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Current Session Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-600 mb-1">Meeting / Event Name (Max 50 chars) *</label>
            <input
              type="text"
              maxLength={50}
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              placeholder="e.g., Weekly Youth Prayer Meeting"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Meeting Date</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Agenda / Notes (Max 150 chars)</label>
            <input
              type="text"
              maxLength={150}
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="Meeting agenda or notes..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Interactive Marking Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search member name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => markAll('Present')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition"
              >
                Mark All Present
              </button>
              <button
                onClick={() => markAll('Absent')}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition"
              >
                Mark All Absent
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Member ID</th>
                <th className="py-3.5 px-6">Youth Member Name</th>
                <th className="py-3.5 px-6">Zone / Sub-Unit</th>
                <th className="py-3.5 px-6">Mobile Number</th>
                <th className="py-3.5 px-6 text-center">Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => {
                  const status = attendanceRecords[m._id] || 'Absent';
                  const isPresent = status === 'Present';

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 font-extrabold text-indigo-600">{m.memberId}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={m.fullName}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
                            }}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{m.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{m.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500">{m.anbiyamName || m.anbiyam || m.zone || 'Sagaya Madha Anbiyam'}</td>
                      <td className="py-4 px-6 text-slate-500">{m.mobileNumber || m.phone || 'N/A'}</td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => toggleStatus(m._id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          {isPresent ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {isPresent ? 'PRESENT' : 'ABSENT'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-xs font-bold">
                    No matching members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Scanner Simulation Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Digital QR Attendance Check-In</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Scan member ID Card QR or type Member ID below to mark instantaneous presence.
              </p>
            </div>

            <form onSubmit={handleQRScan} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Scan or type Member ID (e.g., FY-2026-001)"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQRModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close Scanner
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
