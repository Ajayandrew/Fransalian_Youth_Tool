import React, { useState } from 'react';
import { Cake, Sparkles, X, Gift, Heart, Send, MessageSquare, PartyPopper, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/urlUtils';

export default function BirthdayCelebrationModal({ member, onClose, onTriggerBurst }) {
  if (!member) return null;

  const [blessingStyle, setBlessingStyle] = useState('grace');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  const dob = member.dob ? new Date(member.dob) : new Date();
  const dateStr = dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

  const blessingTemplates = {
    grace: `🎉 Happy Birthday ${member.fullName}! 🎂✨ May the Lord grant you strength, happiness, and abundant grace in all your endeavors as part of our Fransalian Youth Movement! 🙏❤️`,
    joy: `🥳 Wishing a joyful & blessed Birthday to ${member.fullName}! 🍰 Upward & onward in faith, joy, and youth leadership! 🌟`,
    peace: `🕊️ May God's wisdom, peace, and divine favor guide you always, ${member.fullName}! Happy Birthday! 🎈🎁`
  };

  const currentBlessing = customNote.trim() || blessingTemplates[blessingStyle];

  const handleSendWhatsApp = () => {
    onTriggerBurst?.();
    const msg = encodeURIComponent(currentBlessing);
    const mobile = member.mobileNumber || member.whatsappNumber || '';
    if (!mobile) {
      toast.error('Mobile number not available for WhatsApp.');
      return;
    }
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${msg}`, '_blank');
    toast.success(`Opening WhatsApp blessing for ${member.fullName}! 🚀`);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentBlessing);
    setCopied(true);
    toast.success('Birthday blessing copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-white">
        
        {/* Floating background decorative items */}
        <div className="absolute top-3 left-6 text-3xl animate-bounce duration-1000 opacity-60">🎈</div>
        <div className="absolute top-10 right-10 text-3xl animate-pulse duration-700 opacity-60">✨</div>
        <div className="absolute bottom-12 left-8 text-2xl animate-bounce duration-1000 opacity-50">🎂</div>

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/30 animate-pulse">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-amber-300">Birthday Celebration Burst</h2>
              <p className="text-xs text-slate-300 font-medium">Send personalized blessings & burst confetti</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto relative z-10">
          {/* Member Card Spotlight */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-md flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative">
              <img
                src={getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={member.fullName}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
                }}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
              />
              <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-full text-xs shadow-lg animate-bounce">
                👑
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                <Gift className="w-3.5 h-3.5" />
                <span>{dateStr}</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">{member.fullName}</h3>
              <p className="text-xs text-indigo-200 font-semibold">{member.role || 'Youth Member'} • {member.anbiyamName || 'Sagaya Madha Anbiyam'}</p>
            </div>
          </div>

          {/* Burst Confetti Trigger Button */}
          <button
            onClick={() => onTriggerBurst?.()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 transition shadow-lg shadow-amber-500/20 active:scale-98"
          >
            <Sparkles className="w-5 h-5 text-slate-950 animate-spin" />
            <span>Launch Celebration Confetti Burst 🎉</span>
          </button>

          {/* Blessing Message Customizer */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Select Blessing Template:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'grace', label: 'Abundant Grace' },
                { id: 'joy', label: 'Joy & Faith' },
                { id: 'peace', label: 'Peace & Wisdom' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setBlessingStyle(t.id);
                    setCustomNote('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    blessingStyle === t.id && !customNote
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Custom note textarea */}
            <textarea
              rows="3"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Or type your custom birthday blessing note here..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Preview Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-medium text-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">Blessing Preview</span>
            <p className="italic text-slate-300">"{currentBlessing}"</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCopyMessage}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition border border-white/10"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Wish'}
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/30"
            >
              <MessageSquare className="w-4 h-4 fill-slate-950" />
              Send on WhatsApp ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
