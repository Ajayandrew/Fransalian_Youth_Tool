import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Users,
  CreditCard,
  Wallet,
  CalendarCheck,
  Calendar,
  Cake,
  FileSpreadsheet,
  Settings,
  Sparkles,
  ArrowRight,
  X,
  Zap,
  Command
} from 'lucide-react';
import { getImageUrl } from '../utils/urlUtils';

export default function CommandPaletteModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get('/api/members');
        if (res.data && res.data.members) {
          setMembers(res.data.members);
        }
      } catch (e) {}
    };
    fetchMembers();
  }, []);

  const navigationItems = [
    { label: 'Dashboard Overview', path: '/', icon: Zap, color: 'text-amber-500' },
    { label: 'Youth Members Directory', path: '/members', icon: Users, color: 'text-indigo-500' },
    { label: 'Monthly Subscriptions Tracker', path: '/subscriptions', icon: CreditCard, color: 'text-emerald-500' },
    { label: 'Parish Youth Finance & Accounts', path: '/finance', icon: Wallet, color: 'text-blue-500' },
    { label: 'Meeting Attendance Register', path: '/attendance', icon: CalendarCheck, color: 'text-purple-500' },
    { label: 'Upcoming Youth Events', path: '/events', icon: Calendar, color: 'text-rose-500' },
    { label: 'Youth Birthdays & Blessings', path: '/birthdays', icon: Cake, color: 'text-amber-600' },
    { label: 'Analytics & Financial Reports', path: '/reports', icon: FileSpreadsheet, color: 'text-teal-500' },
    { label: 'Organization Settings', path: '/settings', icon: Settings, color: 'text-slate-500' }
  ];

  const filteredPages = navigationItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMembers = query.trim()
    ? members.filter(m =>
        m.fullName?.toLowerCase().includes(query.toLowerCase()) ||
        m.memberId?.toLowerCase().includes(query.toLowerCase()) ||
        m.mobileNumber?.includes(query) ||
        m.anbiyamName?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const combinedResults = [
    ...filteredPages.map(p => ({ type: 'page', ...p })),
    ...filteredMembers.map(m => ({ type: 'member', ...m }))
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (combinedResults.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + combinedResults.length) % (combinedResults.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = combinedResults[selectedIndex];
        if (selected) {
          handleSelect(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combinedResults, selectedIndex]);

  const handleSelect = (item) => {
    onClose();
    if (item.type === 'page') {
      navigate(item.path);
    } else if (item.type === 'member') {
      navigate(`/members?search=${encodeURIComponent(item.fullName)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[80vh]">
        
        {/* Search Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-slate-950/80">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page name, or member name... (Press Esc to close)"
            className="w-full bg-transparent border-none text-sm font-semibold text-white placeholder-slate-400 focus:outline-none"
          />
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 bg-white/10 px-2 py-1 rounded-md">
            ESC
          </span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {/* Quick Pages */}
          {filteredPages.length > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-2">
                Navigation Shortcuts
              </span>
              <div className="space-y-1">
                {filteredPages.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={item.path}
                      onClick={() => handleSelect({ type: 'page', ...item })}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-white/10 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      <ArrowRight className={`w-4 h-4 transition ${isSelected ? 'opacity-100 translate-x-1' : 'opacity-0'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members Search Results */}
          {filteredMembers.length > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 px-3 block mb-2">
                Matched Members ({filteredMembers.length})
              </span>
              <div className="space-y-1">
                {filteredMembers.map((m, idx) => {
                  const globalIdx = filteredPages.length + idx;
                  const isSelected = selectedIndex === globalIdx;

                  return (
                    <div
                      key={m._id}
                      onClick={() => handleSelect({ type: 'member', ...m })}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={m.fullName}
                          className="w-8 h-8 rounded-xl object-cover border border-amber-400/40"
                        />
                        <div>
                          <h4 className="text-xs font-bold">{m.fullName}</h4>
                          <p className={`text-[10px] font-medium ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                            {m.role || 'Youth Member'} • {m.anbiyamName}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-slate-400'}`}>
                        {m.memberId || 'View Profile'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {combinedResults.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
              <p className="text-xs font-semibold">No results found for "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-slate-950/90 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono">↑↓</span> to navigate
            <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono">↵</span> to select
          </div>
          <div className="flex items-center gap-1 font-bold text-indigo-400">
            <Command className="w-3 h-3" /> Fransalian Command Palette
          </div>
        </div>
      </div>
    </div>
  );
}
