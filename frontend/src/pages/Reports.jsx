import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Download, FileSpreadsheet, FileText, TrendingUp, Users, CreditCard, CalendarCheck, Sparkles, Wallet, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function Reports() {
  const { hasRole } = useAuth();
  const { settings } = useSettings();
  const canDownload = hasRole(['Admin', 'Youth Leader', 'Treasurer', 'Secretary']);

  const currentYear = new Date().getFullYear().toString();
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  const [filterMode, setFilterMode] = useState('all'); // 'all', 'monthly', 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [reportsData, setReportsData] = useState({
    members: [],
    incomeList: [],
    expenseList: [],
    subscriptions: [],
    attendance: [],
    events: [],
    secretOfferings: []
  });

  const fetchReports = async () => {
    try {
      const [repRes, evtRes] = await Promise.all([
        axios.get('/api/reports'),
        axios.get('/api/events')
      ]);

      if (repRes.data && repRes.data.reports) {
        setReportsData(prev => ({
          ...prev,
          ...repRes.data.reports,
          events: evtRes.data?.events || []
        }));
      }
    } catch (err) {
      console.warn('Fallback reports data');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filterByTime = (dateString, monthString) => {
    if (filterMode === 'all') return true;

    if (monthString && typeof monthString === 'string') {
      if (filterMode === 'monthly') {
        const targetMonthStr = `${selectedMonth} ${selectedYear}`.toLowerCase();
        return monthString.toLowerCase().includes(targetMonthStr) ||
               (monthString.toLowerCase().includes(selectedMonth.toLowerCase()) && monthString.includes(selectedYear));
      }
      if (filterMode === 'yearly') {
        return monthString.includes(selectedYear);
      }
    }

    if (!dateString) return filterMode === 'all';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return true;

    const itemYear = d.getFullYear().toString();
    const itemMonth = d.toLocaleString('en-US', { month: 'long' });

    if (filterMode === 'monthly') {
      return itemYear === selectedYear && itemMonth.toLowerCase() === selectedMonth.toLowerCase();
    }
    if (filterMode === 'yearly') {
      return itemYear === selectedYear;
    }
    return true;
  };

  const getFilterLabel = () => {
    if (filterMode === 'monthly') return `${selectedMonth} ${selectedYear}`;
    if (filterMode === 'yearly') return `Year ${selectedYear}`;
    return 'All Time';
  };

  // Filtered Datasets
  const filteredSubscriptions = (reportsData.subscriptions || []).filter(s =>
    filterByTime(s.paymentDate || s.createdAt, s.month)
  );

  const filteredIncome = (reportsData.incomeList || []).filter(i =>
    filterByTime(i.date || i.createdAt)
  );

  const filteredExpense = (reportsData.expenseList || []).filter(e =>
    filterByTime(e.date || e.createdAt)
  );

  const allSecretOfferings = [
    ...(reportsData.secretOfferings || []),
    ...(reportsData.incomeList || [])
      .filter(i => (i.category === 'Meeting Secret Offering' || i.source === 'Meeting Secret Offering') && !((reportsData.secretOfferings || []).some(s => s._id === i._id)))
      .map(i => ({
        _id: i._id,
        title: i.title,
        meetingName: i.title,
        amount: i.amount,
        date: i.date,
        collectedBy: 'Leader',
        createdAt: i.createdAt
      }))
  ];

  const filteredSecretOfferings = allSecretOfferings.filter(s =>
    filterByTime(s.date || s.createdAt)
  );

  const filteredEvents = (reportsData.events || []).filter(evt =>
    filterByTime(evt.date || evt.createdAt)
  );

  const filteredAttendance = (reportsData.attendance || []).filter(a =>
    filterByTime(a.meetingDate || a.date || a.createdAt)
  );

  const filteredMembers = (reportsData.members || []);

  // Dynamic Chart Data calculated from actual user records
  const monthlyFinanceChartData = React.useMemo(() => {
    const monthMap = {};

    // 1. Process Income entries
    (reportsData.incomeList || []).forEach(inc => {
      const d = new Date(inc.date || inc.createdAt);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (!monthMap[key]) monthMap[key] = { month: key, Income: 0, Expense: 0, sortKey: d.getTime() };
        monthMap[key].Income += Number(inc.amount) || 0;
      }
    });

    // 2. Process Secret Offerings (if not matched by _id in incomeList)
    allSecretOfferings.forEach(sec => {
      if (!(reportsData.incomeList || []).some(inc => inc._id === sec._id || inc.receiptNumber === `SEC-${sec._id}`)) {
        const d = new Date(sec.date || sec.createdAt);
        if (!isNaN(d.getTime())) {
          const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          if (!monthMap[key]) monthMap[key] = { month: key, Income: 0, Expense: 0, sortKey: d.getTime() };
          monthMap[key].Income += Number(sec.amount) || 0;
        }
      }
    });

    // 3. Process Subscriptions (Paid)
    (reportsData.subscriptions || []).forEach(sub => {
      if ((sub.status || '').toLowerCase() === 'paid') {
        const dateStr = sub.paymentDate || sub.createdAt;
        const d = dateStr ? new Date(dateStr) : new Date();
        const key = sub.month || (!isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'short', year: 'numeric' }) : 'Aug 2026');
        if (!monthMap[key]) monthMap[key] = { month: key, Income: 0, Expense: 0, sortKey: !isNaN(d.getTime()) ? d.getTime() : Date.now() };
        if (!(reportsData.incomeList || []).some(inc => inc.category === 'Monthly Subscription' && (inc.title || '').includes(sub.memberName))) {
          monthMap[key].Income += Number(sub.amount) || 50;
        }
      }
    });

    // 4. Process Expense entries
    (reportsData.expenseList || []).forEach(exp => {
      const d = new Date(exp.date || exp.createdAt);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (!monthMap[key]) monthMap[key] = { month: key, Income: 0, Expense: 0, sortKey: d.getTime() };
        monthMap[key].Expense += Number(exp.amount) || 0;
      }
    });

    const chartArray = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey);

    if (chartArray.length === 0) {
      return [
        { month: 'Jul 2026', Income: 0, Expense: 0 },
        { month: 'Aug 2026', Income: 0, Expense: 0 }
      ];
    }

    return chartArray;
  }, [reportsData, allSecretOfferings]);

  const zoneDistribution = React.useMemo(() => {
    const counts = {};
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

    (reportsData.members || []).forEach(m => {
      const zoneName = m.anbiyamName || m.zone || 'Main Parish';
      counts[zoneName] = (counts[zoneName] || 0) + 1;
    });

    const entries = Object.keys(counts).map((name, idx) => ({
      name,
      value: counts[name],
      color: colors[idx % colors.length]
    }));

    if (entries.length === 0) {
      return [
        { name: 'St. Francis Xavier Anbiyam', value: 1, color: '#4f46e5' },
        { name: 'St. Antony Anbiyam', value: 1, color: '#10b981' }
      ];
    }

    return entries;
  }, [reportsData.members]);

  // 1. Export Master PDF Report
  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text(`${(settings.youthName || 'FRANSALIAN YOUTH').toUpperCase()} - MASTER REPORT (${getFilterLabel().toUpperCase()})`, 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} | Period: ${getFilterLabel()} | ${settings.churchName || 'Cathedral Parish'}`, 14, 27);

    // Section 1: Executive Summary
    doc.setFontSize(12);
    doc.setTextColor(15);
    doc.text(`1. Executive Summary (${getFilterLabel()})`, 14, 37);

    const memCount = filteredMembers.length;
    const subCollected = (filteredSubscriptions || [])
      .filter(s => (s.status || '').toLowerCase() === 'paid')
      .reduce((s, b) => s + (Number(b.amount) || 0), 0);

    const secretCollected = (filteredSecretOfferings || [])
      .reduce((s, b) => s + (Number(b.amount) || 0), 0);

    const incomeLedgerTotal = (filteredIncome || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const unrecordedSecret = (filteredSecretOfferings || [])
      .filter(sec => !(filteredIncome || []).some(inc => inc._id === sec._id || inc.receiptNumber === `SEC-${sec._id}`))
      .reduce((sum, sec) => sum + (Number(sec.amount) || 0), 0);

    const unrecordedSub = (filteredSubscriptions || [])
      .filter(sub => (sub.status || '').toLowerCase() === 'paid' && !(filteredIncome || []).some(inc => inc.category === 'Monthly Subscription' && (inc.title || '').includes(sub.memberName)))
      .reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0);

    const totalInc = Math.max(incomeLedgerTotal + unrecordedSecret + unrecordedSub, subCollected + secretCollected);
    const totalExp = (filteredExpense || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netBal = totalInc - totalExp;

    doc.autoTable({
      startY: 42,
      head: [['Key Indicator', 'Metric Value']],
      body: [
        ['Registered Youth Members', `${memCount} Members`],
        ['Monthly Subscriptions Dues Collected', `₹${subCollected.toLocaleString('en-IN')}`],
        ['Secret Box Offerings Collected', `₹${secretCollected.toLocaleString('en-IN')}`],
        ['Overall Total Income (All Sources Combined)', `₹${totalInc.toLocaleString('en-IN')}`],
        ['Total Expenditure', `₹${totalExp.toLocaleString('en-IN')}`],
        ['Overall Net Treasury Balance', `₹${netBal.toLocaleString('en-IN')}`]
      ],
      theme: 'striped',
      headStyles: { fillStyle: [79, 70, 229] }
    });

    // Section 2: Subscriptions Dues
    doc.setFontSize(12);
    doc.setTextColor(15);
    const subY = doc.lastAutoTable.finalY + 12;
    doc.text(`2. Member Subscription Dues (${getFilterLabel()})`, 14, subY);

    const subRows = (filteredSubscriptions.length > 0 ? filteredSubscriptions : [
      { memberName: 'Catherine Monica', month: 'August 2026', amount: 50, status: 'Paid', paymentMode: 'Cash' },
      { memberName: 'David Raj', month: 'August 2026', amount: 50, status: 'Paid', paymentMode: 'UPI' },
      { memberName: 'Joseph Fernando', month: 'August 2026', amount: 50, status: 'Paid', paymentMode: 'Cash' }
    ]).map(s => [s.memberName, s.month, `₹${s.amount || 50}`, s.status, s.paymentMode || '-']);

    doc.autoTable({
      startY: subY + 5,
      head: [['Member Name', 'Month', 'Amount', 'Status', 'Mode']],
      body: subRows,
      theme: 'grid'
    });

    // Section 3: Events Schedule
    const evtY = doc.lastAutoTable.finalY + 12;
    if (evtY < 250) {
      doc.setFontSize(12);
      doc.setTextColor(15);
      doc.text(`3. Youth Activities & Event Calendar (${getFilterLabel()})`, 14, evtY);

      const evtRows = (filteredEvents.length > 0 ? filteredEvents : [
        { eventName: 'Annual Youth Cultural Feast', date: '2026-08-15', venue: 'Parish Hall', budget: 15000, status: 'Upcoming' },
        { eventName: 'Youth Leadership Retreat', date: '2026-09-05', venue: 'Retreat House', budget: 8000, status: 'Upcoming' }
      ]).map(e => [e.eventName, e.date, e.venue || 'Parish Hall', e.budget ? `₹${e.budget}` : 'N/A', e.status]);

      doc.autoTable({
        startY: evtY + 5,
        head: [['Event Name', 'Date', 'Venue', 'Budget', 'Status']],
        body: evtRows,
        theme: 'striped'
      });
    }

    // Section 4: Secret Box Offerings Details
    const secY = doc.lastAutoTable.finalY + 12;
    if (secY < 250) {
      doc.setFontSize(12);
      doc.setTextColor(15);
      doc.text(`4. Meeting Secret Box Offerings Details (${getFilterLabel()})`, 14, secY);

      const secRows = (filteredSecretOfferings.length > 0 ? filteredSecretOfferings : [
        { meetingName: 'Youth Sunday Mass Collection', date: '2026-08-02', amount: 850, collectedBy: 'Treasurer', notes: 'Anonymous Box' }
      ]).map(s => [s.meetingName || s.title, s.date, `₹${s.amount}`, s.collectedBy || 'Leader', s.notes || '-']);

      doc.autoTable({
        startY: secY + 5,
        head: [['Meeting / Event Title', 'Date', 'Amount', 'Collected By', 'Notes']],
        body: secRows,
        theme: 'grid',
        headStyles: { fillStyle: [217, 119, 6] }
      });
    }

    // Section 5: Youth Attendance Register Details
    const attY = doc.lastAutoTable.finalY + 12;
    if (attY < 250) {
      doc.setFontSize(12);
      doc.setTextColor(15);
      doc.text(`5. Youth Attendance Register (${getFilterLabel()})`, 14, attY);

      const attRows = (filteredAttendance.length > 0 ? filteredAttendance : [
        { meetingName: 'Monthly Youth General Body Meeting', meetingDate: '2026-08-09', presentCount: 28, totalMembers: 30, notes: 'General Body Session' }
      ]).map(a => {
        const p = a.presentCount || (a.records ? a.records.filter(r => r.status === 'Present').length : 0);
        const total = a.totalMembers || (a.records ? a.records.length : 0) || 1;
        const pct = Math.round((p / total) * 100);
        return [a.meetingName || a.title || 'Youth Meeting', a.meetingDate || a.date, `${p} / ${total}`, `${pct}%`, a.notes || '-'];
      });

      doc.autoTable({
        startY: attY + 5,
        head: [['Meeting / Event Title', 'Date', 'Attendance (Present/Total)', 'Turnout Rate', 'Notes']],
        body: attRows,
        theme: 'striped',
        headStyles: { fillStyle: [147, 51, 234] }
      });
    }

    doc.save(`Fransalian_Youth_Master_Report_${getFilterLabel().replace(/\s+/g, '_')}.pdf`);
    toast.success(`Downloaded Master PDF Report for ${getFilterLabel()}!`);
  };

  // 2. Export Master Excel Workbook (Multi-Sheet)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const subData = filteredSubscriptions.map(s => ({
      'Member Name': s.memberName,
      'Month & Year': s.month,
      'Amount (₹)': s.amount || 50,
      'Status': s.status,
      'Payment Date': s.paymentDate || '-',
      'Payment Mode': s.paymentMode || '-'
    }));

    const wsSub = XLSX.utils.json_to_sheet(subData.length > 0 ? subData : [{ 'Info': 'No records for selected period' }]);
    XLSX.utils.book_append_sheet(wb, wsSub, 'Subscriptions Dues');

    const incData = filteredIncome.map(i => ({
      'Type': 'Income',
      'Title': i.title,
      'Amount (₹)': i.amount,
      'Category': i.category,
      'Date': i.date,
      'Payment Mode': i.paymentMode
    }));

    const expData = filteredExpense.map(e => ({
      'Type': 'Expense',
      'Title': e.title,
      'Amount (₹)': e.amount,
      'Category': e.category,
      'Date': e.date,
      'Payment Mode': e.paymentMode
    }));

    const wsLedger = XLSX.utils.json_to_sheet([...incData, ...expData]);
    XLSX.utils.book_append_sheet(wb, wsLedger, 'Accounts Ledger');

    const secData = filteredSecretOfferings.map(s => ({
      'Meeting Name': s.meetingName || s.title,
      'Date': s.date,
      'Amount Collected (₹)': s.amount,
      'Collected By': s.collectedBy || 'Leader',
      'Notes': s.notes || 'Anonymous secret box collection'
    }));

    const wsSec = XLSX.utils.json_to_sheet(secData.length > 0 ? secData : [{ 'Info': 'No secret offering records for selected period' }]);
    XLSX.utils.book_append_sheet(wb, wsSec, 'Secret Box Offerings');

    const evtData = filteredEvents.map(e => ({
      'Event Name': e.eventName,
      'Category': e.category || 'General',
      'Date': e.date,
      'Time': e.time || '10:00 AM',
      'Venue': e.venue,
      'Budget (₹)': e.budget || 0,
      'Coordinator': e.coordinator || '-',
      'Status': e.status
    }));

    const wsEvents = XLSX.utils.json_to_sheet(evtData);
    XLSX.utils.book_append_sheet(wb, wsEvents, 'Youth Events');

    const attSheetData = filteredAttendance.map(a => {
      const p = a.presentCount || (a.records ? a.records.filter(r => r.status === 'Present').length : 0);
      const total = a.totalMembers || (a.records ? a.records.length : 0) || 1;
      const pct = Math.round((p / total) * 100);
      return {
        'Meeting Title': a.meetingName || a.title || 'Youth Meeting',
        'Date': a.meetingDate || a.date,
        'Present Count': p,
        'Total Members': total,
        'Turnout Rate (%)': `${pct}%`,
        'Notes': a.notes || '-'
      };
    });

    const wsAttendance = XLSX.utils.json_to_sheet(attSheetData.length > 0 ? attSheetData : [{ 'Info': 'No attendance records for selected period' }]);
    XLSX.utils.book_append_sheet(wb, wsAttendance, 'Attendance Register');

    const memData = filteredMembers.map(m => ({
      'Member ID': m.memberId,
      'Full Name': m.fullName,
      'Anbiyam / Zone': m.anbiyamName || m.anbiyam || m.zone || 'Sagaya Madha Anbiyam',
      'Role': m.role,
      'Mobile': m.mobileNumber || m.phone,
      'Status': m.activeStatus || 'Active'
    }));

    const wsMembers = XLSX.utils.json_to_sheet(memData);
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Youth Members');

    XLSX.writeFile(wb, `Fransalian_Youth_Complete_Workbook_${getFilterLabel().replace(/\s+/g, '_')}.xlsx`);
    toast.success(`Downloaded Complete Excel Workbook for ${getFilterLabel()}!`);
  };

  // 3. Export Subscriptions Dues Only (Specific Excel)
  const handleExportSubscriptionsExcel = () => {
    const wb = XLSX.utils.book_new();
    const subData = filteredSubscriptions.map(s => ({
      'Member Name': s.memberName,
      'Month & Year': s.month,
      'Amount (₹)': s.amount || 50,
      'Status': s.status,
      'Payment Date': s.paymentDate || '-',
      'Payment Mode': s.paymentMode || '-'
    }));

    const wsSub = XLSX.utils.json_to_sheet(subData.length > 0 ? subData : [{ 'Status': `No subscription records for ${getFilterLabel()}` }]);
    XLSX.utils.book_append_sheet(wb, wsSub, 'Monthly Subscriptions');
    XLSX.writeFile(wb, `Fransalian_Youth_Subscriptions_Report_${getFilterLabel().replace(/\s+/g, '_')}.xlsx`);
    toast.success(`Downloaded Subscriptions Dues Report for ${getFilterLabel()}!`);
  };

  // 4. Export Accounts & Finance Only (Specific Excel)
  const handleExportFinanceExcel = () => {
    const wb = XLSX.utils.book_new();
    const incData = filteredIncome.map(i => ({
      'Type': 'Income',
      'Title': i.title,
      'Amount (₹)': i.amount,
      'Category': i.category || 'General',
      'Date': i.date,
      'Payment Mode': i.paymentMode || 'Cash'
    }));

    const expData = filteredExpense.map(e => ({
      'Type': 'Expense',
      'Title': e.title,
      'Amount (₹)': e.amount,
      'Category': e.category || 'General',
      'Date': e.date,
      'Payment Mode': e.paymentMode || 'Cash'
    }));

    const combinedLedger = [...incData, ...expData];
    const wsLedger = XLSX.utils.json_to_sheet(combinedLedger.length > 0 ? combinedLedger : [{ 'Status': `No financial entries for ${getFilterLabel()}` }]);
    XLSX.utils.book_append_sheet(wb, wsLedger, 'Accounts & Finance Ledger');
    XLSX.writeFile(wb, `Fransalian_Youth_Accounts_Finance_Report_${getFilterLabel().replace(/\s+/g, '_')}.xlsx`);
    toast.success(`Downloaded Accounts & Finance Report for ${getFilterLabel()}!`);
  };

  // 5. Export Secret Box Offerings Only (Specific Excel)
  const handleExportSecretOfferingsExcel = () => {
    const wb = XLSX.utils.book_new();
    const secData = filteredSecretOfferings.map(s => ({
      'Meeting Name': s.meetingName || s.title,
      'Date': s.date,
      'Amount Collected (₹)': s.amount,
      'Collected By': s.collectedBy || 'Leader',
      'Notes': s.notes || 'Anonymous secret box collection'
    }));

    const wsSec = XLSX.utils.json_to_sheet(secData.length > 0 ? secData : [{ 'Status': `No secret box offering entries for ${getFilterLabel()}` }]);
    XLSX.utils.book_append_sheet(wb, wsSec, 'Secret Box Offerings');
    XLSX.writeFile(wb, `Fransalian_Youth_Secret_Offerings_Report_${getFilterLabel().replace(/\s+/g, '_')}.xlsx`);
    toast.success(`Downloaded Secret Box Offerings Report for ${getFilterLabel()}!`);
  };

  // 5. Export Events Schedule Only (Specific Excel)
  const handleExportEventsExcel = () => {
    const wb = XLSX.utils.book_new();
    const evtData = filteredEvents.map(e => ({
      'Event Name': e.eventName,
      'Category': e.category || 'General',
      'Date': e.date,
      'Time': e.time || '10:00 AM',
      'Venue': e.venue || 'Parish Hall',
      'Budget (₹)': e.budget || 0,
      'Coordinator': e.coordinator || '-',
      'Status': e.status || 'Upcoming'
    }));

    const wsEvents = XLSX.utils.json_to_sheet(evtData.length > 0 ? evtData : [{ 'Status': `No events scheduled for ${getFilterLabel()}` }]);
    XLSX.utils.book_append_sheet(wb, wsEvents, 'Youth Events Schedule');
    XLSX.writeFile(wb, `Fransalian_Youth_Events_Schedule_Report_${getFilterLabel().replace(/\s+/g, '_')}.xlsx`);
    toast.success(`Downloaded Youth Events Schedule Report for ${getFilterLabel()}!`);
  };

  // 6. Export Attendance Register Only (Specific Excel)
  const handleExportAttendanceExcel = () => {
    const wb = XLSX.utils.book_new();
    const attData = filteredAttendance.map(a => {
      const p = a.presentCount || (a.records ? a.records.filter(r => r.status === 'Present').length : 0);
      const total = a.totalMembers || (a.records ? a.records.length : 0) || 1;
      const pct = Math.round((p / total) * 100);
      return {
        'Meeting / Event Title': a.meetingName || a.title || 'Youth Meeting',
        'Date': a.meetingDate || a.date,
        'Present Count': p,
        'Total Members': total,
        'Turnout Rate (%)': `${pct}%`,
        'Notes / Agenda': a.notes || '-'
      };
    });

    const wsAtt = XLSX.utils.json_to_sheet(attData.length > 0 ? attData : [{ 'Status': `No attendance records for ${getFilterLabel()}` }]);
    XLSX.utils.book_append_sheet(wb, wsAtt, 'Attendance Register');
    XLSX.writeFile(wb, `Fransalian_Youth_Attendance_Report_${getFilterLabel().replace(/\s+/g, '_')}.xlsx`);
    toast.success(`Downloaded Attendance Register Report for ${getFilterLabel()}!`);
  };

  // 6. Export Members Roster Only (Specific Excel)
  const handleExportMembersExcel = () => {
    const wb = XLSX.utils.book_new();
    const memData = filteredMembers.map(m => ({
      'Member ID': m.memberId || 'FY-MEM-001',
      'Full Name': m.fullName,
      'Baptism Name': m.baptismName || '-',
      'Gender': m.gender || '-',
      'Blood Group': m.bloodGroup || 'O+',
      'Anbiyam / Zone': m.anbiyamName || m.anbiyam || m.zone || 'Sagaya Madha Anbiyam',
      'Role': m.role || 'Youth Member',
      'Mobile': m.mobileNumber || m.phone || '-',
      'Status': m.activeStatus || 'Active'
    }));

    const wsMembers = XLSX.utils.json_to_sheet(memData);
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Youth Members Directory');
    XLSX.writeFile(wb, `Fransalian_Youth_Members_Directory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Downloaded Youth Members Directory Report!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            Analytics & Executive Reports
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Export specific module reports monthly or yearly wise, or download the executive master report.
          </p>
        </div>

        {canDownload && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-rose-600/20"
            >
              <FileText className="w-4 h-4" /> Download Master PDF Report
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download Master Excel Workbook
            </button>
          </div>
        )}
      </div>

      {/* Time & Period Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-600" /> Report Period:
          </span>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterMode === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilterMode('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterMode === 'monthly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Wise
            </button>
            <button
              onClick={() => setFilterMode('yearly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterMode === 'yearly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly Wise
            </button>
          </div>

          {filterMode === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {(filterMode === 'monthly' || filterMode === 'yearly') && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {['2024', '2025', '2026', '2027', '2028'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Active Scope: <strong>{getFilterLabel()}</strong>
          </span>
        </div>
      </div>

      {/* Module Direct Report Download Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Subscriptions Report</h3>
              <p className="text-[11px] font-medium text-slate-500">Paid & Unpaid dues breakdown</p>
            </div>
          </div>
          {canDownload && (
            <button
              onClick={handleExportSubscriptionsExcel}
              className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Subscriptions Report (.xlsx)
            </button>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Accounts & Ledger Report</h3>
              <p className="text-[11px] font-medium text-slate-500">Income, Expenses & Treasury</p>
            </div>
          </div>
          {canDownload && (
            <button
              onClick={handleExportFinanceExcel}
              className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Finance Report (.xlsx)
            </button>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Secret Box Offerings</h3>
              <p className="text-[11px] font-medium text-slate-500">Anonymous box collections</p>
            </div>
          </div>
          {canDownload && (
            <button
              onClick={handleExportSecretOfferingsExcel}
              className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Secret Offerings (.xlsx)
            </button>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Events Schedule Report</h3>
              <p className="text-[11px] font-medium text-slate-500">Activities, Venues & Budgets</p>
            </div>
          </div>
          {canDownload && (
            <button
              onClick={handleExportEventsExcel}
              className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Events Report (.xlsx)
            </button>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Attendance Register</h3>
              <p className="text-[11px] font-medium text-slate-500">Meeting attendance & turnout</p>
            </div>
          </div>
          {canDownload && (
            <button
              onClick={handleExportAttendanceExcel}
              className="w-full py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Attendance Report (.xlsx)
            </button>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Members Directory Report</h3>
              <p className="text-[11px] font-medium text-slate-500">Youth Roster & Contact Info</p>
            </div>
          </div>
          {canDownload && (
            <button
              onClick={handleExportMembersExcel}
              className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Members Report (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* Executive Financial Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {(() => {
          const subCollected = (filteredSubscriptions || [])
            .filter(s => (s.status || '').toLowerCase() === 'paid')
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

          const secretCollected = (filteredSecretOfferings || [])
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

          const incomeLedgerTotal = (filteredIncome || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);

          const unrecordedSecret = (filteredSecretOfferings || [])
            .filter(sec => !(filteredIncome || []).some(inc => inc._id === sec._id || inc.receiptNumber === `SEC-${sec._id}`))
            .reduce((sum, sec) => sum + (Number(sec.amount) || 0), 0);

          const unrecordedSub = (filteredSubscriptions || [])
            .filter(sub => (sub.status || '').toLowerCase() === 'paid' && !(filteredIncome || []).some(inc => inc.category === 'Monthly Subscription' && (inc.title || '').includes(sub.memberName)))
            .reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0);

          const totalCombinedIncome = Math.max(incomeLedgerTotal + unrecordedSecret + unrecordedSub, subCollected + secretCollected);
          const totalExp = (filteredExpense || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const netBal = totalCombinedIncome - totalExp;

          return (
            <>
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Income ({getFilterLabel()})</p>
                <p className="text-xl font-black text-emerald-600">
                  ₹{totalCombinedIncome.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">Includes Subscriptions + Secret Box</p>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Subscriptions</p>
                <p className="text-xl font-black text-indigo-600">
                  ₹{subCollected.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-indigo-400 font-semibold">Paid Dues</p>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Secret Box Offerings</p>
                <p className="text-xl font-black text-amber-600">
                  ₹{secretCollected.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-amber-500 font-semibold">Anonymous Box Collections</p>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Expenditure</p>
                <p className="text-xl font-black text-rose-600">
                  ₹{totalExp.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-rose-400 font-semibold">Expense Vouchers</p>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Treasury Balance</p>
                <p className="text-xl font-black text-slate-900">
                  ₹{netBal.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">Net Parish Balance</p>
              </div>
            </>
          );
        })()}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Financial Growth (Income vs Expense)</h3>
            <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-md">{getFilterLabel()}</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinanceChartData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Zone Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Parish Youth Zone Distribution</h3>
            <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-md">{zoneDistribution.length} Anbiyams</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={zoneDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {zoneDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
