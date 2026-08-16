import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Wallet, Crown, Heart, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import PhotoLightboxModal from '../components/PhotoLightboxModal';
import { getImageUrl } from '../utils/urlUtils';

export default function Login() {
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [registeredMembers, setRegisteredMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get('/api/members');
        if (res.data && res.data.members) {
          setRegisteredMembers(res.data.members);
        }
      } catch (err) {
        console.warn('Unable to load registered members');
      }
    };
    fetchMembers();
  }, []);

  // Find assigned members for key office bearer roles
  const getAssignedCard = (roleName, defaultLabel, icon, colorClass, defaultEmail) => {
    let assignedMember = registeredMembers.find(
      m => (m.role || '').toLowerCase() === roleName.toLowerCase()
    );

    if (!assignedMember && roleName === 'Parish Priest') {
      if (settings.parishPriestName) {
        return {
          roleName: 'Parish Priest',
          displayTitle: `${defaultLabel}: ${settings.parishPriestName}`,
          memberName: settings.parishPriestName,
          email: 'priest@church.org',
          photo: settings.parishPriestPhoto || null,
          anbiyam: settings.parishPriestTitle || 'Parish Priest / Spiritual Director',
          icon,
          colorClass,
          isAssigned: true
        };
      }
    }

    if (assignedMember) {
      return {
        roleName: assignedMember.role,
        displayTitle: `${defaultLabel}: ${assignedMember.fullName}`,
        memberName: assignedMember.fullName,
        email: assignedMember.email || assignedMember.role,
        photo: assignedMember.photo,
        anbiyam: assignedMember.anbiyamName || 'Parish Member',
        icon,
        colorClass,
        isAssigned: true
      };
    }

    return {
      roleName,
      displayTitle: `${defaultLabel} (Unassigned)`,
      memberName: 'No Member Assigned Yet',
      email: defaultEmail,
      photo: null,
      anbiyam: 'Click to login',
      icon,
      colorClass,
      isAssigned: false
    };
  };

  const roleCards = [
    getAssignedCard('Parish Priest', 'Parish Priest (Director)', UserCheck, 'bg-purple-50 border-purple-200 text-purple-950 hover:bg-purple-100 shadow-purple-100', 'priest@church.org'),
    getAssignedCard('Youth Leader', 'Youth Leader (President)', Crown, 'bg-indigo-50 border-indigo-200 text-indigo-950 hover:bg-indigo-100 shadow-indigo-100', 'Youth Leader'),
    getAssignedCard('Secretary', 'Secretary (Records)', ShieldCheck, 'bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-100 shadow-amber-100', 'Secretary'),
    getAssignedCard('Treasurer', 'Treasurer (Accounts)', Wallet, 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100 shadow-emerald-100', 'Treasurer'),
    getAssignedCard('Admin', 'Father / Super Admin', Heart, 'bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100 shadow-rose-100', 'admin@church.org')
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter email and password.');
    }
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res?.success) {
        navigate('/');
      }
    } catch (err) {
      toast.error('Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleCardClick = (card) => {
    const loginEmail = card.email || card.roleName;
    setEmail(loginEmail);
    setPassword('');
    toast.success(`Selected ${card.roleName}. Please enter your password to sign in.`);
    setTimeout(() => {
      const el = document.getElementById('login-password-input');
      if (el) el.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-block cursor-pointer group"
            onClick={() => settings.churchLogo && setShowLogoModal(true)}
            title={settings.churchLogo ? "Click to view and download logo" : ""}
          >
            {settings.churchLogo ? (
              <img src={getImageUrl(settings.churchLogo)} alt="Logo" className="w-16 h-16 rounded-full object-contain mx-auto mb-2 group-hover:scale-105 transition-transform" />
            ) : (
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 shadow-lg shadow-indigo-600/30 text-white font-black text-2xl mb-2">
                {(settings.youthName || 'FY').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{settings.youthName || 'Francisalian Youth Management System'}</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold">{settings.churchName || 'St. Mary Cathedral'} • {settings.youthName || 'Francisalian Youth Movement'}</p>
        </div>

        {/* Office Bearers Role Cards Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Select Office Bearer Role to Sign In:</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
              Password Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roleCards.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRoleCardClick(card)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start space-x-4 shadow-sm hover:shadow-md cursor-pointer ${card.colorClass} ${email === card.email ? 'ring-2 ring-indigo-600 shadow-md' : ''
                    }`}
                >
                  {card.photo ? (
                    <img
                      src={getImageUrl(card.photo)}
                      alt={card.memberName}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
                      }}
                      className="w-14 h-14 rounded-2xl object-cover object-top border-2 border-white shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="p-3 rounded-2xl bg-white shadow-xs flex-shrink-0">
                      <IconComp className="w-6 h-6 text-slate-800" />
                    </div>
                  )}

                  <div className="truncate w-full space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 text-slate-900 border border-slate-200">
                        {card.roleName}
                      </span>
                      {card.isAssigned && (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          Assigned
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 truncate pt-1">{card.memberName}</h3>
                    <p className="text-[11px] text-slate-600 font-medium truncate">{card.anbiyam}</p>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-extrabold text-indigo-700">
                      <span>Select Role & Enter Password →</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Login Form */}
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 text-center">Or Sign In with Email / Role & Password</h3>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address / Role Title</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter member email or role title (e.g. Youth Leader)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (default Admin@123)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition"
            >
              <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <footer className="text-center text-xs text-slate-500 font-medium pt-4">
          Copyright © Fransalian Youth 2026
        </footer>
      </div>

      {/* Logo Lightbox Modal */}
      {showLogoModal && settings.churchLogo && (
        <PhotoLightboxModal
          photoUrl={settings.churchLogo}
          title={`${settings.churchName || 'Parish'} Crest Logo`}
          subtitle={settings.youthName || 'Youth Movement'}
          allowDownload={true}
          onClose={() => setShowLogoModal(false)}
        />
      )}
    </div>
  );
}
