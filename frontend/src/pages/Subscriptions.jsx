import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CreditCard, CheckCircle2, AlertCircle, Search, Calendar,
  Lock, X, Check, MessageSquare, Phone, Send, Copy, Share2,
  ChevronRight, Sparkles, AlertTriangle, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';

export default function Subscriptions() {
  const { hasRole } = useAuth();
  const { fetchWithCache, invalidateCache, cache } = useDataCache();
  const { settings } = useSettings();
  
  // Real-time current month string (e.g., "September 2026")
  const realTimeCurrentMonth = `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`;
  
  const [selectedMonth, setSelectedMonth] = useState(realTimeCurrentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Paid' | 'Pending'

  const cachedSubKey = `subscriptions${JSON.stringify({ month: selectedMonth, year: selectedYear })}`;
  const cachedSub = cache[cachedSubKey];
  const cachedMembers = cache['members{}'];

  const [subscriptionsData, setSubscriptionsData] = useState(() => cachedSub || {
    summary: {
      totalMembers: 0,
      paidCount: 0,
      pendingCount: 0,
      expectedCollection: 0,
      totalCollected: 0,
      pendingCollection: 0
    },
    subscriptions: []
  });

  const [membersList, setMembersList] = useState(() => {
    if (cachedMembers && (cachedMembers.members || Array.isArray(cachedMembers))) {
      return Array.isArray(cachedMembers) ? cachedMembers : cachedMembers.members || [];
    }
    return [];
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [payMemberName, setPayMemberName] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([selectedMonth]);
  const [payAmount, setPayAmount] = useState(50);
  const [payMode, setPayMode] = useState('Cash');
  const [payRemarks, setPayRemarks] = useState('Monthly Subscription Collected');
  const [shareOption, setShareOption] = useState('modal'); // 'modal' | 'whatsapp' | 'sms'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Post-Payment Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);

  // Subscription collection is strictly restricted to Treasurer and Admin
  const canEdit = hasRole(['Admin', 'Treasurer']);
  const isCurrentMonth = selectedMonth.toLowerCase() === realTimeCurrentMonth.toLowerCase();

  const allMonthsList = [
    `January ${selectedYear}`, `February ${selectedYear}`, `March ${selectedYear}`, `April ${selectedYear}`,
    `May ${selectedYear}`, `June ${selectedYear}`, `July ${selectedYear}`, `August ${selectedYear}`,
    `September ${selectedYear}`, `October ${selectedYear}`, `November ${selectedYear}`, `December ${selectedYear}`
  ];

  const getMemberPhone = (memberName) => {
    const mem = membersList.find(m => (m.fullName || '').trim().toLowerCase() === (memberName || '').trim().toLowerCase());
    if (!mem) return '';
    return mem.mobileNumber || mem.whatsappNumber || mem.phone || '';
  };

  const generateReceiptText = (memberName, months, amount, paymentMode) => {
    const monthsText = Array.isArray(months) ? months.join(', ') : months;
    const youth = (settings?.youthName || 'Fransalian Youth').toUpperCase();
    const church = settings?.churchName || 'Mary Help of Christians Church, Vaniyambadi';
    return `${youth}\n${church}\nSUBSCRIPTION REPORT\n------------------------------\nDear ${memberName},\n\nThank you! Your Youth Subscription payment has been successfully recorded.\n\nAmount Paid: ₹${amount}\nMonth(s) Cleared: ${monthsText}\nPayment Mode: ${paymentMode || 'Cash'}\nStatus: PAID ✅\nDate: ${new Date().toLocaleDateString('en-GB')}\n------------------------------\nThank you for your active support & commitment!`;
  };

  const sendDirectSMS = async (data) => {
    const phone = data.phone || getMemberPhone(data.memberName);
    if (!phone) {
      toast.error(`No phone number found for ${data.memberName}.`);
      return;
    }

    const toastId = toast.loading(`Sending SMS to ${data.memberName}...`, { id: 'sms-dispatch' });
    try {
      const res = await axios.post('/api/subscriptions/send-sms', {
        memberName: data.memberName,
        phone,
        months: data.months,
        amount: data.amount,
        paymentMode: data.paymentMode
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || `✅ SMS sent successfully to ${phone}!`, { id: 'sms-dispatch', duration: 4000 });
        return;
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (res.data && res.data.isUnconfigured) {
        toast.dismiss(toastId);
        const text = generateReceiptText(data.memberName, data.months, data.amount, data.paymentMode);

        if (!isMobile) {
          // Desktop PC / Laptop has no native SMS app
          navigator.clipboard.writeText(text);
          toast.error(
            '💻 Desktop PCs have no cellular SMS app. Receipt copied to clipboard! Please send via WhatsApp or add Fast2SMS API key in Settings.',
            { duration: 6000 }
          );
          return;
        }

        // Mobile device fallback
        toast('Opening Messages app to send via your free SIM pack... 📱', { icon: '📱' });
        const cleanPhone = phone.replace(/\D/g, '');
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const separator = isIOS ? '&' : '?';
        const targetNumber = cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone;
        const smsUrl = `sms:${targetNumber}${separator}body=${encodeURIComponent(text)}`;
        window.location.href = smsUrl;
        return;
      }

      toast.error(res.data?.message || 'Failed to send automated SMS.', { id: 'sms-dispatch' });
    } catch (err) {
      console.warn('Backend SMS failed:', err);
      toast.dismiss(toastId);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const text = generateReceiptText(data.memberName, data.months, data.amount, data.paymentMode);

      if (!isMobile) {
        navigator.clipboard.writeText(text);
        toast.error(
          '💻 Desktop PC detected. Native SMS app not available. Receipt copied to clipboard!',
          { duration: 5000 }
        );
        return;
      }

      // Mobile Fallback
      toast('Opening device SMS composer...', { icon: '📱' });
      const cleanPhone = phone.replace(/\D/g, '');
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const separator = isIOS ? '&' : '?';
      const targetNumber = cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone;
      const smsUrl = `sms:${targetNumber}${separator}body=${encodeURIComponent(text)}`;
      window.location.href = smsUrl;
    }
  };

  const sendDirectWhatsApp = (data) => {
    const phone = data.phone || getMemberPhone(data.memberName);
    const text = generateReceiptText(data.memberName, data.months, data.amount, data.paymentMode);
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // On desktop PC/Laptop, direct to WhatsApp Web; on mobile, open WhatsApp app via wa.me / api
    const formattedPhone = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '';
    const url = formattedPhone
      ? (isMobile
          ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`
          : `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`)
      : (isMobile
          ? `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
          : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`);

    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      toast.error('⚠️ Pop-up blocked! Please allow pop-ups for this site in your browser address bar to open WhatsApp.');
    } else {
      toast.success(isMobile ? 'Opening WhatsApp app... 💬' : 'Opening WhatsApp Web... 💬');
    }
  };

  const copyReceiptToClipboard = (data) => {
    const text = generateReceiptText(data.memberName, data.months, data.amount, data.paymentMode);
    navigator.clipboard.writeText(text);
    toast.success('Receipt copied to clipboard! 📋');
  };

  const fetchSubscriptions = async () => {
    try {
      const [subData, memData] = await Promise.all([
        fetchWithCache('subscriptions', '/api/subscriptions', {
          month: selectedMonth, year: selectedYear, search, status: statusFilter !== 'All' ? statusFilter : ''
        }),
        fetchWithCache('members', '/api/members')
      ]);

      if (subData && subData.success) {
        setSubscriptionsData(subData);
      }
      if (memData && memData.success) {
        setMembersList(memData.members || []);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [selectedMonth, selectedYear, search, statusFilter]);

  // Open Payment modal with smart pre-selection of months
  const openCollectModal = (memberName) => {
    const targetName = memberName || membersList[0]?.fullName || '';
    setPayMemberName(targetName);

    // Find member record to see already paid months
    const subRecord = (subscriptionsData.subscriptions || []).find(
      s => s.memberName.trim().toLowerCase() === targetName.trim().toLowerCase()
    );
    const paidMonths = subRecord?.paidMonths || [];

    // Pre-select the current viewing month if not already paid, or first unpaid month
    const initialMonths = [];
    if (!paidMonths.some(pm => pm.toLowerCase() === selectedMonth.toLowerCase())) {
      initialMonths.push(selectedMonth);
    } else {
      const firstUnpaid = allMonthsList.find(m => !paidMonths.some(pm => pm.toLowerCase() === m.toLowerCase()));
      if (firstUnpaid) initialMonths.push(firstUnpaid);
      else initialMonths.push(selectedMonth);
    }

    setSelectedMonths(initialMonths);
    setPayAmount(initialMonths.length * (subscriptionsData.defaultSubsAmount || 50));
    setPayRemarks(initialMonths.length > 1 ? `₹50 × ${initialMonths.length} months subscription` : 'Monthly Subscription Collected');
    setShowModal(true);
  };

  // When member changes in modal, refresh unpaid month suggestions
  const handleMemberChangeInModal = (targetName) => {
    setPayMemberName(targetName);
    const subRecord = (subscriptionsData.subscriptions || []).find(
      s => s.memberName.trim().toLowerCase() === targetName.trim().toLowerCase()
    );
    const paidMonths = subRecord?.paidMonths || [];

    const initialMonths = [];
    if (!paidMonths.some(pm => pm.toLowerCase() === selectedMonth.toLowerCase())) {
      initialMonths.push(selectedMonth);
    } else {
      const firstUnpaid = allMonthsList.find(m => !paidMonths.some(pm => pm.toLowerCase() === m.toLowerCase()));
      if (firstUnpaid) initialMonths.push(firstUnpaid);
      else initialMonths.push(selectedMonth);
    }

    setSelectedMonths(initialMonths);
    setPayAmount(initialMonths.length * (subscriptionsData.defaultSubsAmount || 50));
  };

  const toggleMonthSelection = (m) => {
    let updated = [];
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length === 1) {
        toast.error('At least one month must be selected.');
        return;
      }
      updated = selectedMonths.filter(item => item !== m);
    } else {
      updated = [...selectedMonths, m];
    }
    setSelectedMonths(updated);
    setPayAmount(updated.length * (subscriptionsData.defaultSubsAmount || 50));
    if (updated.length > 1) {
      setPayRemarks(`₹50 × ${updated.length} months subscription`);
    } else {
      setPayRemarks('Monthly Subscription Collected');
    }
  };

  const handleMarkPaid = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!payMemberName) return toast.error('Select a member.');
    if (!selectedMonths.length) return toast.error('Please select at least one month.');

    const targetMemberName = payMemberName;
    const targetAmount = Number(payAmount) || (selectedMonths.length * 50);
    const targetMode = payMode;
    const memberPhone = getMemberPhone(targetMemberName);

    setIsSubmitting(true);
    try {
      const selectedMemObj = membersList.find(m => m.fullName === targetMemberName);
      const res = await axios.post('/api/subscriptions/pay', {
        memberId: selectedMemObj ? selectedMemObj._id : 'mem_' + Date.now(),
        memberName: targetMemberName,
        months: selectedMonths,
        year: selectedYear,
        amount: targetAmount,
        paymentMode: targetMode,
        remarks: payRemarks
      });

      if (res.data && res.data.success) {
        toast.success(`₹${targetAmount} collected for ${targetMemberName} (${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''})!`);
        setShowModal(false);
        invalidateCache('subscriptions');
        invalidateCache('dashboard');
        invalidateCache('finance');
        fetchSubscriptions();

        const newReceipt = {
          memberName: targetMemberName,
          phone: memberPhone,
          months: selectedMonths,
          amount: targetAmount,
          paymentMode: targetMode,
          date: new Date().toLocaleDateString('en-GB')
        };

        // Open receipt modal
        setReceiptData(newReceipt);

        // If user specifically requested instant auto-share
        if (shareOption === 'whatsapp' && memberPhone) {
          setTimeout(() => {
            sendDirectWhatsApp(newReceipt);
          }, 350);
        } else if (shareOption === 'sms' && memberPhone) {
          setTimeout(() => {
            sendDirectSMS(newReceipt);
          }, 350);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTogglePaid = async (memberName) => {
    try {
      const selectedMemObj = membersList.find(m => m.fullName === memberName);
      const memberPhone = getMemberPhone(memberName);
      const res = await axios.post('/api/subscriptions/pay', {
        memberId: selectedMemObj ? selectedMemObj._id : 'mem_' + Date.now(),
        memberName,
        month: selectedMonth,
        year: selectedYear,
        amount: 50,
        paymentMode: 'Cash',
        remarks: selectedMonth.toLowerCase() === realTimeCurrentMonth.toLowerCase()
          ? '₹50 Monthly Subscription Collected'
          : `₹50 Arrears / Backlog Cleared for ${selectedMonth}`
      });
      if (res.data && res.data.success) {
        toast.success(`₹50 Subscription recorded for ${memberName} (${selectedMonth})!`);
        invalidateCache('subscriptions');
        invalidateCache('dashboard');
        invalidateCache('finance');
        fetchSubscriptions();

        // Prompt with receipt modal including SMS option
        setReceiptData({
          memberName,
          phone: memberPhone,
          months: [selectedMonth],
          amount: 50,
          paymentMode: 'Cash',
          date: new Date().toLocaleDateString('en-GB')
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record subscription.');
    }
  };

  const handleMarkUnpaid = async (memberName) => {
    try {
      const selectedMemObj = membersList.find(m => m.fullName === memberName);
      const res = await axios.post('/api/subscriptions/unpaid', {
        memberName,
        memberId: selectedMemObj ? selectedMemObj._id : undefined,
        month: selectedMonth
      });
      if (res.data && res.data.success) {
        toast.success(`Subscription for ${memberName} set to UNPAID for ${selectedMonth}.`);
        invalidateCache('subscriptions');
        invalidateCache('dashboard');
        invalidateCache('finance');
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subscription status.');
    }
  };


  const allSubList = subscriptionsData.subscriptions || [];
  const paidSubs = allSubList.filter(s => (s.status || '').toLowerCase() === 'paid');
  const unpaidSubs = allSubList.filter(s => (s.status || '').toLowerCase() !== 'paid');

  const summary = subscriptionsData.summary || {
    totalMembers: allSubList.length,
    paidCount: paidSubs.length,
    pendingCount: unpaidSubs.length,
    expectedCollection: allSubList.length * 50,
    totalCollected: paidSubs.reduce((sum, s) => sum + (Number(s.amount) || 50), 0),
    pendingCollection: unpaidSubs.length * 50
  };

  // Get currently selected member's paid months for the modal view
  const currentModalMemberSub = allSubList.find(
    s => s.memberName.trim().toLowerCase() === payMemberName.trim().toLowerCase()
  );
  const currentModalPaidMonths = currentModalMemberSub?.paidMonths || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <CreditCard className="w-6 h-6" />
            </div>
            Monthly Dues & Subscriptions
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track ₹50 monthly contributions per member. Supports multi-month bulk collection & arrears settlement.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              onClick={() => openCollectModal()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <CreditCard className="w-4 h-4" /> Collect Multi-Month / Dues
            </button>
          )}
        </div>
      </div>

      {/* Arrears / Non-Current Month Banner */}
      {!isCurrentMonth && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              Viewing <strong>{selectedMonth}</strong> ledger. {canEdit ? 'As Treasurer, you can record arrears payments or switch to current month.' : 'Viewing ledger history.'}
            </span>
          </div>
          <button
            onClick={() => setSelectedMonth(realTimeCurrentMonth)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap transition shadow-xs w-max"
          >
            Switch to Active Month ({realTimeCurrentMonth})
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Expected Collection ({selectedMonth})</span>
          <h3 className="text-2xl font-black text-slate-900">₹{(summary.expectedCollection || 0).toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500">{summary.totalMembers} Total Registered Members</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Collected</span>
          <h3 className="text-2xl font-black text-emerald-600">₹{(summary.totalCollected || 0).toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-600 font-bold">{summary.paidCount} Members Paid</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Collection</span>
          <h3 className="text-2xl font-black text-amber-600">₹{(summary.pendingCollection || 0).toLocaleString()}</h3>
          <p className="text-[11px] text-amber-600 font-bold">{summary.pendingCount} Members Pending Dues</p>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              {allMonthsList.map(m => (
                <option key={m} value={m}>
                  {m} {m.toLowerCase() === realTimeCurrentMonth.toLowerCase() ? '(Current Active Month)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto justify-center sm:justify-start">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition ${
              statusFilter === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({summary.totalMembers})
          </button>

          <button
            onClick={() => setStatusFilter('Paid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
              statusFilter === 'Paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid ({summary.paidCount})
          </button>

          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
              statusFilter === 'Pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Pending ({summary.pendingCount})
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Member Name</th>
                <th className="p-4">Annual Progress</th>
                <th className="p-4">Month & Year</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4">Mode / Remarks</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(subscriptionsData.subscriptions || []).map((sub) => {
                const paidCountYear = (sub.paidMonths || []).length;
                const isPaid = sub.status === 'Paid';

                return (
                  <tr key={sub._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{sub.memberName}</div>
                      {sub.phone && <div className="text-[10px] text-slate-400">{sub.phone}</div>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${paidCountYear >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                          {paidCountYear}/12 Paid
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-indigo-600">{sub.month}</td>
                    <td className="p-4 font-black text-slate-900">₹{sub.amount || 50}</td>
                    <td className="p-4">
                      {isPaid ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAID</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1 w-max">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>UNPAID</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">{sub.paymentDate}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-700">{sub.paymentMode}</div>
                      {sub.remarks && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{sub.remarks}</div>}
                    </td>
                    <td className="p-4 text-right">
                      {canEdit ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Quick Toggle Paid / Unpaid */}
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 shadow-xs">
                            <button
                              type="button"
                              onClick={() => !isPaid && handleQuickTogglePaid(sub.memberName)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition flex items-center gap-1 ${
                                isPaid
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                              }`}
                              title={isPaid ? 'Already Paid' : 'Click to Mark Paid for this month'}
                            >
                              <CheckCircle2 className="w-3 h-3" /> PAID
                            </button>
                            <button
                              type="button"
                              onClick={() => isPaid && handleMarkUnpaid(sub.memberName)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition flex items-center gap-1 ${
                                !isPaid
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                              }`}
                              title={!isPaid ? 'Already Unpaid' : 'Click to Mark Unpaid'}
                            >
                              <X className="w-3 h-3" /> UNPAID
                            </button>
                          </div>

                          {/* Multi-Month / Arrears Collect Button */}
                          <button
                            type="button"
                            onClick={() => openCollectModal(sub.memberName)}
                            className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                            title="Collect Multiple Months or Arrears"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick SMS & WhatsApp for Paid member */}
                          {isPaid && (
                            <>
                              <button
                                type="button"
                                onClick={() => sendDirectSMS({
                                  memberName: sub.memberName,
                                  phone: sub.phone,
                                  months: [sub.month],
                                  amount: sub.amount || 50,
                                  paymentMode: sub.paymentMode
                                })}
                                className="p-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition"
                                title="Send Direct SMS Receipt"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => sendDirectWhatsApp({
                                  memberName: sub.memberName,
                                  phone: sub.phone,
                                  months: [sub.month],
                                  amount: sub.amount || 50,
                                  paymentMode: sub.paymentMode
                                })}
                                className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                title="Send Receipt via WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-500 border border-slate-200 flex items-center space-x-1 w-max ml-auto">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>View Only</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Multi-Month Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Record Subscription Payment</h3>
                  <p className="text-[11px] text-slate-500">Collect for single or multiple months / arrears together</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkPaid} className="space-y-4 text-xs font-semibold">
              {/* Member Selector */}
              <div>
                <label className="block text-slate-600 mb-1.5">Select Member</label>
                <select
                  value={payMemberName}
                  onChange={(e) => handleMemberChangeInModal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                >
                  {membersList.map(m => (
                    <option key={m._id} value={m.fullName}>
                      {m.fullName} {m.mobileNumber ? `(${m.mobileNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selection Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-600">
                    Select Months to Settle <span className="text-indigo-600 font-bold">({selectedMonths.length} selected)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const unpaidOnly = allMonthsList.filter(m => !currentModalPaidMonths.some(pm => pm.toLowerCase() === m.toLowerCase()));
                        setSelectedMonths(unpaidOnly.length ? unpaidOnly : [selectedMonth]);
                        setPayAmount((unpaidOnly.length || 1) * 50);
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-bold px-1.5 py-0.5"
                    >
                      Select Unpaid
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonths([selectedMonth]);
                        setPayAmount(50);
                      }}
                      className="text-[10px] text-slate-500 hover:underline font-bold px-1.5 py-0.5"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto">
                  {allMonthsList.map(m => {
                    const monthShort = m.split(' ')[0];
                    const isSelected = selectedMonths.includes(m);
                    const isAlreadyPaid = currentModalPaidMonths.some(pm => pm.toLowerCase() === m.toLowerCase());
                    const isCurrent = m.toLowerCase() === realTimeCurrentMonth.toLowerCase();

                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMonthSelection(m)}
                        className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : isAlreadyPaid
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">{monthShort}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : isAlreadyPaid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : null}
                        </div>
                        <span className={`text-[9px] font-semibold mt-1 ${isSelected ? 'text-indigo-100' : isAlreadyPaid ? 'text-emerald-600' : isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {isAlreadyPaid ? 'Paid' : isCurrent ? 'Active' : 'Unpaid'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-sm focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">₹50 × {selectedMonths.length} month(s)</p>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-600 mb-1">Remarks</label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="e.g. Paid 2 months together"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* 100% Free Receipt Sharing Options */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    Receipt Sharing (100% Free)
                  </span>
                  <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Zero Cost
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShareOption(shareOption === 'whatsapp' ? 'modal' : 'whatsapp')}
                    className={`py-2 px-2.5 rounded-xl font-bold text-[11px] border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      shareOption === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" /> Auto WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareOption('modal')}
                    className={`py-2 px-2.5 rounded-xl font-bold text-[11px] border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      shareOption === 'modal'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" /> Show in Dialog
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedMonths.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Recording...' : `Confirm Payment (₹${payAmount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Payment Share & Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Payment Recorded Successfully!</h3>
              </div>
              <button onClick={() => setReceiptData(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="text-center pb-2.5 mb-1.5 border-b border-slate-200">
                <h4 className="font-black text-slate-900 uppercase tracking-wide text-xs">
                  {settings?.youthName || 'Fransalian Youth'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {settings?.churchName || 'Mary Help of Christians Church, Vaniyambadi'}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-[10px] uppercase tracking-wider">
                  Subscription Report
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-bold text-slate-900">{receiptData.memberName}</span>
              </div>
              {receiptData.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-bold text-slate-800">{receiptData.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Months Cleared:</span>
                <span className="font-bold text-indigo-600">{receiptData.months.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Collected:</span>
                <span className="font-black text-emerald-600 text-sm">₹{receiptData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-700">{receiptData.paymentMode}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => sendDirectWhatsApp(receiptData)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-98"
              >
                <Share2 className="w-4 h-4" /> Send Receipt via WhatsApp (100% Free)
              </button>
              <button
                type="button"
                onClick={() => sendDirectSMS(receiptData)}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition active:scale-98"
              >
                <MessageSquare className="w-4 h-4" /> Send Free SIM SMS (Device Messages)
              </button>
              <button
                type="button"
                onClick={() => copyReceiptToClipboard(receiptData)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-4 h-4" /> Copy Receipt Text
              </button>
              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="w-full py-1.5 text-center text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

