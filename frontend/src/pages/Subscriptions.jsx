import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle2, AlertCircle, Search, Calendar, FileSpreadsheet, Lock, X, Sparkles, Filter, RotateCcw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';

export default function Subscriptions() {
  const { hasRole } = useAuth();
  
  // Calculate real-time current month string (e.g., "August 2026")
  const realTimeCurrentMonth = `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`;
  
  const [selectedMonth, setSelectedMonth] = useState(realTimeCurrentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Paid' | 'Pending'

  const [subscriptionsData, setSubscriptionsData] = useState({
    summary: {
      totalMembers: 4,
      paidCount: 3,
      pendingCount: 1,
      expectedCollection: 200,
      totalCollected: 150,
      pendingCollection: 50
    },
    subscriptions: []
  });

  const [membersList, setMembersList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [payMemberName, setPayMemberName] = useState('');
  const [payAmount, setPayAmount] = useState(50);
  const [payMode, setPayMode] = useState('Cash');
  const [payRemarks, setPayRemarks] = useState('Paid at monthly meeting');

  // Office bearers can manage subscription status
  const canEdit = hasRole(['Admin', 'Treasurer', 'Youth Leader', 'Secretary']);
  const isCurrentMonth = selectedMonth.toLowerCase() === realTimeCurrentMonth.toLowerCase();

  const allMonthsList = [
    'January 2026', 'February 2026', 'March 2026', 'April 2026',
    'May 2026', 'June 2026', 'July 2026', 'August 2026',
    'September 2026', 'October 2026', 'November 2026', 'December 2026'
  ];

  const fetchSubscriptions = async () => {
    try {
      const [subRes, memRes] = await Promise.all([
        axios.get('/api/subscriptions', {
          params: { month: selectedMonth, year: selectedYear, search, status: statusFilter !== 'All' ? statusFilter : '' }
        }),
        axios.get('/api/members')
      ]);

      if (subRes.data && subRes.data.success) {
        setSubscriptionsData(subRes.data);
      }
      if (memRes.data && memRes.data.success) {
        setMembersList(memRes.data.members || []);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [selectedMonth, selectedYear, search, statusFilter]);

  const handleMarkPaid = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isCurrentMonth) {
      return toast.error(`Subscription payments are locked for ${selectedMonth}. You can only record payments for the active current month (${realTimeCurrentMonth}).`);
    }
    if (!payMemberName) return toast.error('Select a member.');
    try {
      const selectedMemObj = membersList.find(m => m.fullName === payMemberName);
      const res = await axios.post('/api/subscriptions/pay', {
        memberId: selectedMemObj ? selectedMemObj._id : 'mem_' + Date.now(),
        memberName: payMemberName,
        month: selectedMonth,
        year: selectedYear,
        amount: Number(payAmount) || 50,
        paymentMode: payMode,
        remarks: payRemarks
      });
      if (res.data && res.data.success) {
        toast.success(`₹${payAmount} Subscription collected for ${payMemberName}!`);
        setShowModal(false);
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record subscription.');
    }
  };

  const handleMarkUnpaid = async (memberName) => {
    if (!isCurrentMonth) {
      return toast.error(`Subscription changes are locked for ${selectedMonth}. Active current month is ${realTimeCurrentMonth}.`);
    }
    try {
      const res = await axios.post('/api/subscriptions/unpaid', {
        memberName,
        month: selectedMonth
      });
      if (res.data && res.data.success) {
        toast.success(`Subscription for ${memberName} set to UNPAID / PENDING.`);
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subscription status.');
    }
  };

  const handleQuickPay = (memberName) => {
    if (!isCurrentMonth) {
      return toast.error(`Payment collection is locked for ${selectedMonth}. Active current month is ${realTimeCurrentMonth}.`);
    }
    setPayMemberName(memberName);
    setShowModal(true);
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
            Track ₹50 monthly contributions per member. Status toggles are active for the current active month.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              {isCurrentMonth ? (
                <button
                  onClick={() => {
                    const pendingMem = (subscriptionsData.subscriptions || []).find(s => s.status === 'Pending');
                    setPayMemberName(pendingMem ? pendingMem.memberName : (membersList[0]?.fullName || ''));
                    setShowModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20"
                >
                  <CreditCard className="w-4 h-4" /> Collect ₹50 Subscription
                </button>
              ) : (
                <div className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs flex items-center gap-2 border border-slate-200 cursor-not-allowed">
                  <Lock className="w-4 h-4 text-slate-400" /> Payment Locked (Current Month Only)
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lock Banner Warning for Non-Current Month */}
      {!isCurrentMonth && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              Viewing <strong>{selectedMonth}</strong> ledger. Subscription changes are locked. Status can only be toggled for the active current month (<strong>{realTimeCurrentMonth}</strong>).
            </span>
          </div>
          <button
            onClick={() => setSelectedMonth(realTimeCurrentMonth)}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] whitespace-nowrap transition shadow-xs"
          >
            Switch to Active Month
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

      {/* Toolbar & Paid / Unpaid Status Toggle Filter Buttons */}
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
                  {m} {m.toLowerCase() === realTimeCurrentMonth.toLowerCase() ? '(Current Active Month)' : '(Locked)'}
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
            All Members ({summary.totalMembers})
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
            <AlertCircle className="w-3.5 h-3.5" /> Unpaid / Pending ({summary.pendingCount})
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
                <th className="p-4">Month & Year</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4">Payment Mode</th>
                <th className="p-4 text-right">PAID / UNPAID Toggle Switch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(subscriptionsData.subscriptions || []).map((sub) => (
                <tr key={sub._id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900">{sub.memberName}</td>
                  <td className="p-4 font-semibold text-indigo-600">{sub.month}</td>
                  <td className="p-4 font-black text-slate-900">₹{sub.amount || 50}</td>
                  <td className="p-4">
                    {sub.status === 'Paid' ? (
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 w-max">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>PAID</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1 w-max">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>UNPAID / PENDING</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500">{sub.paymentDate}</td>
                  <td className="p-4 font-semibold text-slate-600">{sub.paymentMode}</td>
                  <td className="p-4 text-right">
                    {canEdit && isCurrentMonth ? (
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 shadow-xs ml-auto">
                        <button
                          type="button"
                          onClick={() => sub.status !== 'Paid' && handleQuickPay(sub.memberName)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1 ${
                            sub.status === 'Paid'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                          }`}
                          title="Click to Mark Paid"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                        </button>
                        <button
                          type="button"
                          onClick={() => sub.status === 'Paid' && handleMarkUnpaid(sub.memberName)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1 ${
                            sub.status === 'Pending' || sub.status === 'Unpaid'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                          }`}
                          title="Click to Mark Unpaid"
                        >
                          <XCircle className="w-3.5 h-3.5" /> UNPAID
                        </button>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-500 border border-slate-200 flex items-center space-x-1 w-max ml-auto">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Locked</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Record Subscription Collection</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkPaid} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Select Member</label>
                <select
                  value={payMemberName}
                  onChange={(e) => setPayMemberName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  {membersList.map(m => (
                    <option key={m._id} value={m.fullName}>{m.fullName} ({m.memberId || 'Youth Member'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Month & Year</label>
                  <input
                    type="text"
                    disabled
                    value={selectedMonth}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / GPay">UPI / GPay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Remarks</label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="Monthly meeting payment"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  Confirm Paid (₹{payAmount})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
