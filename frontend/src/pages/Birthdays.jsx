import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cake, Calendar, Gift, Send, Phone, MessageSquare, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/urlUtils';

export default function Birthdays() {
  const [members, setMembers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get('/api/members');
        if (res.data && res.data.members) {
          setMembers(res.data.members);
        }
      } catch (err) {
        console.warn('Fallback member birthday list');
      }
    };
    fetchMembers();
  }, []);

  // Filter members born in selectedMonth
  const birthdayMembers = members.filter(m => {
    if (!m.dob) return false;
    const dobMonth = new Date(m.dob).getMonth();
    return dobMonth === Number(selectedMonth);
  });

  const sendWhatsAppWish = (member) => {
    const msg = encodeURIComponent(`🎉 Happy Birthday ${member.fullName}! 🎂 May God bless you abundantly on your special day! - Fransalian Youth Group ✨`);
    const mobile = member.mobileNumber || member.phone || '';
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${msg}`, '_blank');
    toast.success(`Opening WhatsApp wish for ${member.fullName}!`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
              <Cake className="w-6 h-6" />
            </div>
            Youth Member Birthdays
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Celebrate parish youth members' special days and send personalized WhatsApp blessings.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
          >
            {months.map((month, i) => (
              <option key={month} value={i}>
                {month} Celebrations
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Birthday Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {birthdayMembers.length > 0 ? (
          birthdayMembers.map((m) => {
            const dob = new Date(m.dob);
            const dateStr = dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

            return (
              <div
                key={m._id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-rose-400/20 rounded-bl-full pointer-events-none" />

                <div>
                  <div className="flex items-center gap-4">
                    <img
                      src={getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                      alt={m.fullName}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
                      }}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                    />
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        <Gift className="w-3 h-3" /> {dateStr}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1">{m.fullName}</h3>
                      <p className="text-xs text-slate-500 font-semibold">{m.role || 'Youth Member'}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600 space-y-1.5">
                    <p><span className="text-slate-400">Anbiyam / Zone:</span> {m.anbiyamName || m.anbiyam || m.zone || 'Sagaya Madha Anbiyam'}</p>
                    <p><span className="text-slate-400">Mobile:</span> {m.mobileNumber || m.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  <button
                    onClick={() => sendWhatsAppWish(m)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
                  >
                    <MessageSquare className="w-4 h-4" /> Send Birthday Blessing on WhatsApp
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <Cake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-extrabold text-slate-700">No birthdays in {months[selectedMonth]}</h4>
            <p className="text-xs font-medium text-slate-400 mt-1">Select a different month to view upcoming celebrations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
