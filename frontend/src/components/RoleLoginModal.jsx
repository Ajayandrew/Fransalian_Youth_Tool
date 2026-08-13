import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ShieldCheck, Wallet, UserCheck, FileText, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RoleLoginModal({ isOpen, onClose, initialRole = 'Admin' }) {
  const { login } = useAuth();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/members')
        .then(res => {
          if (res.data && res.data.members) {
            setMembers(res.data.members);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const baseRoleOptions = [
    {
      role: 'Admin',
      name: 'Super Admin / Pastor',
      icon: ShieldCheck,
      color: 'bg-indigo-600 text-white border-indigo-600',
      badge: 'Full Access',
      desc: 'Complete system administrative access'
    },
    {
      role: 'Parish Priest',
      name: 'Parish Priest (Director)',
      icon: UserCheck,
      color: 'bg-amber-600 text-white border-amber-600',
      badge: 'Spiritual & Youth Oversight',
      desc: 'Full executive oversight, member records & reports'
    },
    {
      role: 'Youth Leader',
      name: 'Youth Leader (President)',
      icon: UserCheck,
      color: 'bg-purple-600 text-white border-purple-600',
      badge: 'Members & Reports',
      desc: 'Youth profiles, activities, and executive reports'
    },
    {
      role: 'Treasurer',
      name: 'Treasurer (Accounts)',
      icon: Wallet,
      color: 'bg-emerald-600 text-white border-emerald-600',
      badge: 'Finance & Dues',
      desc: 'Subscription payments & account ledger management'
    },
    {
      role: 'Secretary',
      name: 'Secretary (Records)',
      icon: FileText,
      color: 'bg-amber-600 text-white border-amber-600',
      badge: 'Records & Reports',
      desc: 'Member additions, attendance, and reports'
    }
  ];

  const [selectedRole, setSelectedRole] = useState(
    baseRoleOptions.find(r => r.role === initialRole) || baseRoleOptions[0]
  );
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    const matchedRole = baseRoleOptions.find(r => r.role === initialRole) || baseRoleOptions[0];
    setSelectedRole(matchedRole);
    const assignedMember = members.find(m => (m.role || '').toLowerCase() === matchedRole.role.toLowerCase());
    setEmailInput(assignedMember ? assignedMember.email : '');
    setPasswordInput('');
  }, [initialRole, isOpen, members]);

  if (!isOpen) return null;

  const handleSelectRoleCard = (opt) => {
    setSelectedRole(opt);
    const assignedMember = members.find(m => (m.role || '').toLowerCase() === opt.role.toLowerCase());
    setEmailInput(assignedMember ? assignedMember.email : '');
    setPasswordInput('');
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    if (!emailInput) return toast.error('Please enter User ID / Email.');
    if (!passwordInput) return toast.error('Please enter your Password.');

    try {
      const res = await login(emailInput, passwordInput);
      if (res && res.success) {
        onClose();
      }
    } catch (err) {
      toast.error('Invalid credentials. Check email and password.');
    }
  };

  const Icon = selectedRole.icon;
  const assigned = members.find(m => (m.role || '').toLowerCase() === selectedRole.role.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" /> Switch Role Access
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Select target role and enter credentials to switch active permissions.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Cards Selector */}
        <div className="space-y-2">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">1. Select Target Role</label>
          <div className="grid grid-cols-2 gap-2">
            {baseRoleOptions.map((opt) => (
              <button
                key={opt.role}
                type="button"
                onClick={() => handleSelectRoleCard(opt)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  selectedRole.role === opt.role
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-extrabold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${opt.color}`}>
                  <opt.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs truncate">{opt.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Role Badge Info */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${selectedRole.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">{selectedRole.role} Access</p>
              <p className="text-[10px] text-slate-500 font-medium">
                {assigned ? `Assigned Member: ${assigned.fullName}` : selectedRole.desc}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
            {selectedRole.badge}
          </span>
        </div>

        {/* Login Credentials Form */}
        <form onSubmit={handleSubmitLogin} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-600 mb-1">User ID / Email Address</label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter role email address"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter account password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none pr-9"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" /> Enable {selectedRole.role} Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
