import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, Search, Eye, X, Trash2, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataContext';
import PhotoLightboxModal from '../components/PhotoLightboxModal';

const INCOME_CATEGORIES = [
  'Donation',
  'Offering',
  'Sponsorship',
  'Monthly Contribution',
  'Parish Fund',
  'Fundraiser',
  'Feast Collection',
  'Other'
];

const EXPENSE_CATEGORIES = [
  'Food & Refreshments',
  'Youth Meeting Expenses',
  'Decoration & Stage',
  'Travel & Transport',
  'Sound System & Media',
  'Charity & Outreach',
  'Stationery & Printing',
  'Miscellaneous'
];

export default function Finance() {
  const { hasRole } = useAuth();
  const { fetchWithCache, invalidateCache, cache } = useDataCache();
  const cachedFinance = cache['finance{}'];
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [financeData, setFinanceData] = useState(() => cachedFinance || {
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      runningBalance: 0,
      totalSecretCollection: 0,
      totalMonthlySubscriptions: 0
    },
    incomeList: [],
    expenseList: [],
    secretOfferings: []
  });

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('Income');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Donation',
    paymentMode: 'Cash',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    remarks: ''
  });

  const canEdit = hasRole(['Admin', 'Treasurer', 'Youth Leader', 'Parish Priest']);

  const fetchFinance = async (force = false) => {
    try {
      const data = await fetchWithCache('finance', '/api/finance/summary', {}, force);
      if (data && data.success) {
        setFinanceData(data);
      }
    } catch (err) {
      console.warn('Using default finance data fallback');
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleDelete = async (item) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete ${item.txType} entry: "${item.title}"?`)) return;

    try {
      if (item.txType === 'Income') {
        await axios.delete(`/api/finance/income/${item._id}`);
      } else if (item.txType === 'Expense') {
        await axios.delete(`/api/finance/expense/${item._id}`);
      } else if (item.txType === 'Secret Offering') {
        await axios.delete(`/api/finance/secret-offering/${item._id}`);
      }
      toast.success(`${item.txType} deleted.`);
      invalidateCache('finance');
      invalidateCache('dashboard');
      invalidateCache('reports');
      await fetchFinance(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete transaction.');
    }
  };

  const handleOpenModal = (type) => {
    const normType = type === 'SecretOffering' ? 'Secret Offering' : type;
    setModalType(normType);
    setFormData({
      title: normType === 'Secret Offering' ? 'Weekly Youth Secret Box Collection' : '',
      amount: '',
      category: normType === 'Income' ? 'Donation' : normType === 'Expense' ? 'Youth Meeting Expenses' : 'Secret Offering',
      paymentMode: normType === 'Secret Offering' ? 'Anonymous Box' : 'Cash',
      date: new Date().toISOString().split('T')[0],
      receiptNumber: `REC-${normType.replace(/\s+/g, '').substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      remarks: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.title.trim().length === 0) {
      return toast.error('Please enter a title / description.');
    }
    if (formData.title.trim().length > 70) {
      return toast.error('Title cannot exceed 70 characters.');
    }
    if (formData.remarks && formData.remarks.trim().length > 200) {
      return toast.error('Remarks cannot exceed 200 characters.');
    }

    const numAmount = Number(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      return toast.error('Please enter a valid positive amount.');
    }

    setSubmitting(true);
    try {
      const endpoint = modalType === 'Income' ? '/api/finance/income' 
                     : modalType === 'Expense' ? '/api/finance/expense' 
                     : '/api/finance/secret-offering';
      
      const payload = {
        title: formData.title.trim(),
        amount: numAmount,
        category: (formData.category && formData.category.trim()) || (modalType === 'Income' ? 'Donation' : 'Miscellaneous'),
        paymentMode: formData.paymentMode || 'Cash',
        date: formData.date || new Date().toISOString().split('T')[0],
        receiptNumber: formData.receiptNumber,
        notes: formData.remarks ? formData.remarks.trim() : '',
        remarks: formData.remarks ? formData.remarks.trim() : ''
      };

      const res = await axios.post(endpoint, payload);
      if (res.data && res.data.success) {
        toast.success(`${modalType} recorded successfully!`);
        setShowModal(false);
        invalidateCache('finance');
        invalidateCache('dashboard');
        invalidateCache('reports');
        await fetchFinance(true);
      } else {
        toast.error(res.data?.message || `Failed to record ${modalType}`);
      }
    } catch (err) {
      console.error(`Error saving ${modalType}:`, err);
      const errMsg = err.response?.data?.message || err.message || `Failed to record ${modalType}.`;
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = financeData.summary || {
    totalIncome: 0,
    totalExpense: 0,
    runningBalance: 0,
    totalSecretCollection: 0,
    totalMonthlySubscriptions: 0
  };

  // Combine transactions for unified timeline display, ensuring secret offerings aren't duplicated if mirrored
  const secretIds = new Set((financeData.secretOfferings || []).map(s => s._id));
  const generalIncomes = (financeData.incomeList || []).filter(i => {
    if (secretIds.has(i._id)) return false;
    if (i.category === 'Meeting Secret Offering' || i.source === 'Meeting Secret Offering') {
      return (financeData.secretOfferings || []).length === 0;
    }
    return true;
  });

  const combinedTransactions = [
    ...generalIncomes.map(i => ({ ...i, txType: 'Income' })),
    ...(financeData.expenseList || []).map(e => ({ ...e, txType: 'Expense' })),
    ...(financeData.secretOfferings || []).map(s => ({ ...s, txType: 'Secret Offering' }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
   .filter(item => {
    if (activeTab !== 'all' && item.txType.toLowerCase() !== activeTab.toLowerCase()) return false;
    if (search) {
      const titleMatch = (item.title || item.notes || '').toLowerCase().includes(search.toLowerCase());
      const catMatch = (item.category || '').toLowerCase().includes(search.toLowerCase());
      const recMatch = (item.receiptNumber || '').toLowerCase().includes(search.toLowerCase());
      return titleMatch || catMatch || recMatch;
    }
    return true;
  });

  const currentCategorySuggestions = modalType === 'Income' 
    ? INCOME_CATEGORIES 
    : modalType === 'Expense' 
    ? EXPENSE_CATEGORIES 
    : ['Secret Offering'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Wallet className="w-6 h-6" />
            </div>
            Accounts & Finance
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track income, expense vouchers, secret offerings, and net parish youth funds.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              <button
                onClick={() => handleOpenModal('Income')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" /> Log Income
              </button>
              <button
                onClick={() => handleOpenModal('Expense')}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-rose-600/20"
              >
                <Plus className="w-4 h-4" /> Log Expense
              </button>
              <button
                onClick={() => handleOpenModal('Secret Offering')}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-purple-600/20"
              >
                <DollarSign className="w-4 h-4" /> Secret Offering
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Net Treasury Balance</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">₹{(summary.runningBalance || 0).toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total Income - Total Expenditure
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Combined Collections</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-3">
            ₹{((summary.totalMonthlySubscriptions || 0) + (summary.totalSecretCollection || 0)).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">
            ₹{(summary.totalMonthlySubscriptions || 0).toLocaleString('en-IN')} Subs + ₹{(summary.totalSecretCollection || 0).toLocaleString('en-IN')} Secret
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Income Ledger</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-3">₹{(summary.totalIncome || 0).toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Total revenue including all logged incomes</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Expenditure</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-3">₹{(summary.totalExpense || 0).toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Event, snacks, travel & ministry expenses</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {['all', 'income', 'expense', 'secret offering'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold capitalize whitespace-nowrap transition ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, category, receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Financial Ledger Transactions</h2>
          <span className="text-xs font-bold text-slate-500">{combinedTransactions.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Transaction Detail</th>
                <th className="py-3.5 px-6">Type & Category</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Payment Mode</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                {canEdit && <th className="py-3.5 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {combinedTransactions.length > 0 ? (
                combinedTransactions.map((item, idx) => (
                  <tr key={item._id || idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.title || item.meetingName || 'Secret Box Collection'}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {item.receiptNumber ? item.receiptNumber : (item.collectedBy ? `Collected by: ${item.collectedBy}` : 'N/A')}
                      </div>
                      {item.notes && item.notes !== 'Anonymous secret box collection' && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">{item.notes}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        item.txType === 'Income' ? 'bg-emerald-100 text-emerald-800' :
                        item.txType === 'Expense' ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.txType} • {item.category || (item.txType === 'Secret Offering' ? 'Secret Box' : 'General')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(item.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-600">{item.paymentMode || 'Cash'}</td>
                    <td className={`py-4 px-6 text-right font-black text-sm ${
                      item.txType === 'Income' || item.txType === 'Secret Offering' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {item.txType === 'Expense' ? '-' : '+'}₹{(Number(item.amount) || 0).toLocaleString('en-IN')}
                    </td>
                    {canEdit && (
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-12 text-center text-slate-400 text-xs font-bold">
                    No matching financial transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Log {modalType} Entry</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Title / Description *</label>
                <input
                  type="text"
                  required
                  maxLength={70}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={modalType === 'Income' ? 'e.g., Youth Sunday Donation from Parishioners' : modalType === 'Expense' ? 'e.g., Refreshment Snacks & Tea for Youth Meeting' : 'e.g., Weekly Secret Offering Box'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    {modalType === 'Secret Offering' && <option value="Anonymous Box">Anonymous Box</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    maxLength={50}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Select or type..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                  <datalist id="category-suggestions">
                    {currentCategorySuggestions.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick suggestion pills */}
              {currentCategorySuggestions.length > 1 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Common Categories:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCategorySuggestions.slice(0, 5).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition ${
                          formData.category === cat
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1">Remarks / Note (Optional)</label>
                <textarea
                  rows="2"
                  maxLength={200}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Optional details or note..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Lightbox Modal */}
      {selectedReceipt && (
        <PhotoLightboxModal
          photoUrl={selectedReceipt.url}
          title={selectedReceipt.title}
          subtitle={selectedReceipt.subtitle}
          allowDownload={true}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
