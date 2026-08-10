import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Cake,
  Calendar,
  Gift,
  Send,
  Phone,
  MessageSquare,
  Sparkles,
  Heart,
  PartyPopper,
  Flame,
  Search,
  CheckCircle2,
  Crown,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/urlUtils';
import ConfettiCanvas from '../components/ConfettiCanvas';
import BirthdayCelebrationModal from '../components/BirthdayCelebrationModal';

export default function Birthdays() {
  const confettiRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'today', 'month'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCelebrationMember, setSelectedCelebrationMember] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/members');
        if (res.data && res.data.members) {
          setMembers(res.data.members);
        }
      } catch (err) {
        console.warn('Fallback member birthday list');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Compute Today's Birthdays
  const todayBirthdays = members.filter(m => {
    if (!m.dob) return false;
    const d = new Date(m.dob);
    return d.getMonth() === currentMonth && d.getDate() === currentDate;
  });

  // Auto trigger confetti burst if today has birthdays
  useEffect(() => {
    if (todayBirthdays.length > 0 && confettiRef.current) {
      setTimeout(() => {
        confettiRef.current?.triggerCannon();
      }, 500);
    }
  }, [todayBirthdays.length]);

  // Filter members born in selectedMonth or search query
  const filteredMembers = members.filter(m => {
    if (!m.dob) return false;
    const d = new Date(m.dob);
    const dobMonth = d.getMonth();
    const dobDate = d.getDate();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.fullName?.toLowerCase().includes(q);
      const matchRole = m.role?.toLowerCase().includes(q);
      const matchAnbiyam = m.anbiyamName?.toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchAnbiyam) return false;
    }

    if (filterMode === 'today') {
      return dobMonth === currentMonth && dobDate === currentDate;
    }

    return dobMonth === Number(selectedMonth);
  });

  const triggerBurstAtEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    confettiRef.current?.triggerBurst(x, y, 90);
  };

  const handleFireCannon = () => {
    confettiRef.current?.triggerCannon();
    toast.success('🎉 Birthday Party Cannon Launched! ✨', { icon: '🎂' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* 60fps Interactive Confetti Canvas Overlay */}
      <ConfettiCanvas ref={confettiRef} />

      {/* Floating Animated Balloons in Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-25">
        <div className="absolute top-20 left-10 text-4xl animate-bounce duration-1000">🎈</div>
        <div className="absolute top-40 right-16 text-4xl animate-pulse duration-700">🎉</div>
        <div className="absolute bottom-32 left-1/4 text-4xl animate-bounce duration-1000">✨</div>
        <div className="absolute bottom-20 right-1/3 text-4xl animate-pulse duration-700">🎂</div>
      </div>

      {/* Header Banner */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
              <span>Youth Birthday Celebrations</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Birthday Burst Center 🎂
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 font-medium max-w-xl">
              Celebrate parish youth members' special days with interactive confetti bursts, animated cards & instant WhatsApp blessings.
            </p>
          </div>

          {/* Cannon Burst Action Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleFireCannon}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 hover:from-amber-400 hover:to-indigo-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2.5 transition shadow-lg shadow-amber-500/30 active:scale-95 cursor-pointer"
            >
              <PartyPopper className="w-5 h-5 text-slate-950" />
              <span>Launch Celebration Cannon 🎉</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spotlight: Today's Birthday Stars (If any) */}
      {todayBirthdays.length > 0 && (
        <div className="relative z-10 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 rounded-3xl p-6 text-slate-950 shadow-xl border-2 border-amber-300 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-950 text-amber-400 rounded-2xl shadow-md">
                <Crown className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 bg-white/40 px-2 py-0.5 rounded-full">
                  Live Today!
                </span>
                <h2 className="text-xl font-black text-slate-950">Today's Birthday Spotlights 🔥</h2>
              </div>
            </div>

            <button
              onClick={handleFireCannon}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-300 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition"
            >
              <Flame className="w-4 h-4 text-amber-400" /> Celebrate Today's Stars!
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayBirthdays.map((m) => (
              <div
                key={m._id}
                onClick={(e) => {
                  triggerBurstAtEvent(e);
                  setSelectedCelebrationMember(m);
                }}
                className="bg-slate-950/90 backdrop-blur-md border border-amber-400/40 rounded-2xl p-4 text-white flex items-center gap-4 cursor-pointer hover:scale-102 transition shadow-lg"
              >
                <img
                  src={getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt={m.fullName}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400"
                />
                <div>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                    Today's Birthday 🎂
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{m.fullName}</h3>
                  <p className="text-xs text-indigo-300 font-semibold">{m.role || 'Youth Member'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition border whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            By Month ({months[selectedMonth]})
          </button>
          <button
            onClick={() => setFilterMode('today')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition border whitespace-nowrap flex items-center gap-1.5 ${
              filterMode === 'today'
                ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Today's ({todayBirthdays.length})
          </button>
        </div>

        {/* Month Selector & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member name..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setFilterMode('all');
              }}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            >
              {months.map((month, i) => (
                <option key={month} value={i}>
                  {month} ({members.filter(m => m.dob && new Date(m.dob).getMonth() === i).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Birthday Grid Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading birthday celebrations...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          filteredMembers.map((m) => {
            const dob = new Date(m.dob);
            const dateStr = dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
            const isToday = dob.getMonth() === currentMonth && dob.getDate() === currentDate;

            return (
              <div
                key={m._id}
                className={`bg-white border rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between group ${
                  isToday ? 'border-2 border-amber-400 ring-4 ring-amber-400/20' : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 via-rose-400/20 to-indigo-400/10 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                          alt={m.fullName}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
                          }}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md group-hover:rotate-3 transition-transform"
                        />
                        {isToday && (
                          <span className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 p-1 rounded-full text-xs shadow-md animate-bounce">
                            👑
                          </span>
                        )}
                      </div>

                      <div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isToday ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-amber-100 text-amber-800'
                        }`}>
                          <Gift className="w-3 h-3" /> {dateStr}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1 group-hover:text-amber-600 transition-colors">
                          {m.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold">{m.role || 'Youth Member'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600 space-y-1.5">
                    <p><span className="text-slate-400">Anbiyam:</span> {m.anbiyamName || 'Sagaya Madha Anbiyam'}</p>
                    <p><span className="text-slate-400">Mobile:</span> {m.mobileNumber || m.whatsappNumber || 'N/A'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => {
                      triggerBurstAtEvent(e);
                      toast.success(`🎉 Burst celebration for ${m.fullName}!`);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Burst Confetti
                  </button>

                  <button
                    onClick={(e) => {
                      triggerBurstAtEvent(e);
                      setSelectedCelebrationMember(m);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/20"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Send Wish
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <Cake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-extrabold text-slate-700">No birthdays found</h4>
            <p className="text-xs font-medium text-slate-400 mt-1">Select a different month or clear your search query.</p>
          </div>
        )}
      </div>

      {/* Birthday Celebration Modal */}
      {selectedCelebrationMember && (
        <BirthdayCelebrationModal
          member={selectedCelebrationMember}
          onClose={() => setSelectedCelebrationMember(null)}
          onTriggerBurst={() => confettiRef.current?.triggerCannon()}
        />
      )}
    </div>
  );
}
