import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarCheck, Users, CheckCircle2, XCircle, QrCode, Search, Save, 
  History, Sparkles, UserCheck, Calendar, Download, Lock, Plus, Eye, Trash2, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataContext';
import { getImageUrl } from '../utils/urlUtils';

export default function Attendance() {
  const { hasRole } = useAuth();
  const { fetchWithCache, invalidateCache } = useDataCache();

  // Mode: 'new' (taking new attendance) or 'view' (inspecting a saved past meeting)
  const [sessionMode, setSessionMode] = useState('new'); 
  const [selectedPastSessionId, setSelectedPastSessionId] = useState('');

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
  const isLockedView = sessionMode === 'view';

  const fetchData = async () => {
    try {
      const [memData, attData] = await Promise.all([
        fetchWithCache('members', '/api/members'),
        fetchWithCache('attendance', '/api/attendance')
      ]);

      if (memData && memData.members) {
        setMembers(memData.members);
      }

      if (attData && attData.attendance) {
        const attList = attData.attendance || [];
        setHistoryList(attList);

        // If in 'new' mode and initial load, initialize all members as Present by default
        if (sessionMode === 'new' && memData?.members) {
          const initial = {};
          memData.members.forEach(m => {
            initial[m._id] = 'Present';
          });
          setAttendanceRecords(initial);
        }
      }
    } catch (err) {
      console.warn('Fallback data for attendance');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler to switch session mode or view a past meeting
  const handleSelectSession = (sessionId) => {
    if (sessionId === 'new') {
      setSessionMode('new');
      setSelectedPastSessionId('');
      setMeetingName('Monthly Youth General Body Meeting');
      setMeetingDate(new Date().toISOString().split('T')[0]);
      setMeetingNotes('Discussion on upcoming Feast day youth choir and stall.');
      
      const initial = {};
      members.forEach(m => {
        initial[m._id] = 'Present';
      });
      setAttendanceRecords(initial);
    } else {
      const targetSession = historyList.find(h => h._id === sessionId);
      if (targetSession) {
        setSessionMode('view');
        setSelectedPastSessionId(sessionId);
        setMeetingName(targetSession.meetingName || targetSession.title || 'Youth Meeting');
        setMeetingDate(targetSession.date || targetSession.meetingDate || new Date().toISOString().split('T')[0]);
        setMeetingNotes(targetSession.notes || '');

        // Map saved attendance records for each member
        const savedMap = {};
        const recordsArr = targetSession.records || [];

        members.forEach(m => {
          const matched = recordsArr.find(r => 
            (r.memberId && (r.memberId === m._id || r.memberId === m.memberId)) ||
            (r.memberName && r.memberName.trim().toLowerCase() === m.fullName.trim().toLowerCase())
          );
          savedMap[m._id] = matched ? (matched.status || 'Present') : 'Absent';
        });

        setAttendanceRecords(savedMap);
      }
    }
  };

  const toggleStatus = (memberId) => {
    if (isLockedView) {
      return toast.error('Saved past meeting attendance details are locked and cannot be modified.');
    }
    if (!canEdit) return;
    setAttendanceRecords(prev => ({
      ...prev,
      [memberId]: prev[memberId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const markAll = (status) => {
    if (isLockedView) {
      return toast.error('Saved past meeting attendance details are locked and cannot be modified.');
    }
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
    if (isLockedView) {
      return toast.error('Saved past meeting attendance details are locked and cannot be modified.');
    }
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
      const recordsArray = members.map(m => ({
        memberId: m._id,
        memberName: m.fullName,
        status: attendanceRecords[m._id] || 'Present'
      }));

      const res = await axios.post('/api/attendance', {
        meetingName: meetingName.trim(),
        date: meetingDate,
        records: recordsArray,
        notes: meetingNotes.trim()
      });

      if (res.data && res.data.success) {
        toast.success(`Attendance saved successfully for ${meetingName}!`);
        invalidateCache('attendance');
        invalidateCache('dashboard');
        
        // Refresh and select the newly created session
        const freshAttRes = await axios.get('/api/attendance');
        if (freshAttRes.data && freshAttRes.data.attendance) {
          const updatedList = freshAttRes.data.attendance || [];
          setHistoryList(updatedList);
          const newest = updatedList[0];
          if (newest) {
            handleSelectSession(newest._id);
          }
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance.');
    }
  };

  const handleDeleteSession = async (sessionId, name) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to delete attendance record for "${name}"?`)) return;

    try {
      const res = await axios.delete(`/api/attendance/${sessionId}`);
      if (res.data && res.data.success) {
        toast.success('Attendance session removed.');
        invalidateCache('attendance');
        invalidateCache('dashboard');
        handleSelectSession('new');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete attendance record.');
    }
  };

  const handleQRScan = (e) => {
    e.preventDefault();
    if (isLockedView) {
      return toast.error('Saved past meeting attendance details are locked.');
    }
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
    
    const currentSessionData = members.map(m => ({
      'Member ID': m.memberId || 'FY-MEM',
      'Full Name': m.fullName,
      'Baptism Name': m.baptismName || '-',
      'Zone / Anbiyam': m.anbiyamName || m.zone || 'St. Francis',
      'Attendance Status': attendanceRecords[m._id] || 'Present'
    }));

    const wsCurrent = XLSX.utils.json_to_sheet(currentSessionData);
    XLSX.utils.book_append_sheet(wb, wsCurrent, `${meetingName.slice(0, 25)}`);

    if (historyList && historyList.length > 0) {
      const historyData = historyList.map(h => {
        const p = h.presentCount || (h.records ? h.records.filter(r => r.status === 'Present').length : 0);
        const total = h.totalMembers || (h.records ? h.records.length : 0) || members.length || 1;
        const pct = Math.round((p / total) * 100);
        return {
          'Meeting Title': h.meetingName || h.title || 'Youth Meeting',
          'Date': h.date || h.meetingDate,
          'Present Count': p,
          'Total Members': total,
          'Turnout (%)': `${pct}%`,
          'Agenda Notes': h.notes || '-'
        };
      });
      const wsHistory = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(wb, wsHistory, 'All Saved Meetings');
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
            Record meeting attendance or view past saved meeting registers at any time.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportAttendanceReport}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" /> Export Attendance (.xlsx)
          </button>

          {!isLockedView && (
            <button
              onClick={() => setShowQRModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-md"
            >
              <QrCode className="w-4 h-4 text-amber-400" /> QR Check-In
            </button>
          )}

          {canEdit && !isLockedView && (
            <button
              onClick={handleSaveAttendance}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" /> Save Meeting Attendance
            </button>
          )}
        </div>
      </div>

      {/* Session Mode Selector & History Dropdown */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-600" /> Meeting Session:
          </span>

          <select
            value={sessionMode === 'new' ? 'new' : selectedPastSessionId}
            onChange={(e) => handleSelectSession(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="new">➕ Take New Meeting Attendance (Active Session)</option>
            <optgroup label="📋 Saved Past Attendance Logs">
              {historyList.map(h => {
                const p = h.records ? h.records.filter(r => r.status === 'Present').length : 0;
                const total = h.records ? h.records.length : members.length || 1;
                const pct = Math.round((p / total) * 100);
                return (
                  <option key={h._id} value={h._id}>
                    🔒 {h.date || h.meetingDate}: {h.meetingName || h.title} ({p}/{total} Present - {pct}%)
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {isLockedView ? (
            <div className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Saved Meeting Record (Locked / Read-Only)</span>
              <button
                onClick={() => handleSelectSession('new')}
                className="ml-2 px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] hover:bg-amber-700 transition"
              >
                + New Meeting
              </button>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Attendance Session (Editable)</span>
            </div>
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
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {isLockedView ? 'Saved Meeting Details (Read-Only)' : 'Current Meeting Details'}
          </h2>
          {isLockedView && canEdit && (
            <button
              onClick={() => handleDeleteSession(selectedPastSessionId, meetingName)}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Saved Record
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-600 mb-1">Meeting / Event Name *</label>
            <input
              type="text"
              disabled={isLockedView}
              maxLength={50}
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              placeholder="e.g., Weekly Youth Prayer Meeting"
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                isLockedView 
                  ? 'bg-slate-100 border-slate-200 text-slate-700 font-bold cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Meeting Date</label>
            <input
              type="date"
              disabled={isLockedView}
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                isLockedView 
                  ? 'bg-slate-100 border-slate-200 text-slate-700 font-bold cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Agenda / Notes</label>
            <input
              type="text"
              disabled={isLockedView}
              maxLength={150}
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="Meeting agenda or notes..."
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                isLockedView 
                  ? 'bg-slate-100 border-slate-200 text-slate-700 font-bold cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Interactive Attendance Register Table */}
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

          {canEdit && !isLockedView && (
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

          {isLockedView && (
            <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Viewing Saved Record ({meetingDate})</span>
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
                <th className="py-3.5 px-6 text-center">Attendance Status</th>
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
                          disabled={isLockedView}
                          onClick={() => toggleStatus(m._id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                          } ${isLockedView ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                          title={isLockedView ? 'Saved Past Meeting Attendance (Locked)' : 'Click to Toggle Status'}
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

      {/* Past Attendance Sessions Log Table Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" /> Past Meeting Attendance Logs ({historyList.length} Sessions Saved)
          </h2>
          <span className="text-xs font-bold text-slate-500">View or load any saved meeting attendance at any time</span>
        </div>

        {historyList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black border-b border-slate-100">
                <tr>
                  <th className="p-3">Meeting Title</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Turnout (Present / Total)</th>
                  <th className="p-3">Turnout Rate</th>
                  <th className="p-3">Agenda / Notes</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {historyList.map((h) => {
                  const p = h.records ? h.records.filter(r => r.status === 'Present').length : 0;
                  const total = h.records ? h.records.length : members.length || 1;
                  const pct = Math.round((p / total) * 100);
                  const isSelected = selectedPastSessionId === h._id;

                  return (
                    <tr key={h._id} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-indigo-50/50 font-bold' : ''}`}>
                      <td className="p-3 font-bold text-slate-900">{h.meetingName || h.title}</td>
                      <td className="p-3 text-indigo-600 font-bold">{h.date || h.meetingDate}</td>
                      <td className="p-3">
                        <span className="text-emerald-600 font-black">{p}</span> / <span className="text-slate-500">{total}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          pct >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {pct}% Turnout
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{h.notes || '-'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSelectSession(h._id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition shadow-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Register
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-400 py-6 text-center">
            No saved meeting attendance records yet. Take a new attendance session above and click "Save Meeting Attendance".
          </p>
        )}
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
                placeholder="Scan or type Member ID (e.g., FY-MEM-001)"
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
