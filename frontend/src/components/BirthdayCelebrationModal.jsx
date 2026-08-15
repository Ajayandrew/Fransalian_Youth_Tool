import React, { useState, useEffect } from 'react';
import { Cake, Sparkles, X, Gift, Heart, Send, MessageSquare, PartyPopper, Check, Copy, Eye, ZoomIn, Download, Flame, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/urlUtils';
import PhotoLightboxModal from './PhotoLightboxModal';

export default function BirthdayCelebrationModal({ member, onClose, onTriggerBurst }) {
  if (!member) return null;

  const [blessingStyle, setBlessingStyle] = useState('grace');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [candlesLit, setCandlesLit] = useState(true);

  const parseDOB = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const photoUrl = getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
  const dob = parseDOB(member.dob);
  const dateStr = dob ? dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : 'Special Birthday';

  // Auto trigger confetti burst on modal open
  useEffect(() => {
    onTriggerBurst?.();
  }, []);

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

  const handleToggleCandles = () => {
    setCandlesLit(prev => !prev);
    onTriggerBurst?.();
    toast.success(candlesLit ? '🎂 Blew out candles! Make a wish! ✨' : '🕯️ Lit candles back up! 🎉');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-400/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-white">
          
          {/* Floating animated background party balloons & sparkles */}
          <div className="absolute top-4 left-6 text-3xl animate-bounce duration-1000 opacity-80 pointer-events-none">🎈</div>
          <div className="absolute top-12 right-8 text-3xl animate-pulse duration-700 opacity-80 pointer-events-none">✨</div>
          <div className="absolute bottom-16 left-6 text-3xl animate-bounce duration-1000 opacity-70 pointer-events-none">🎂</div>
          <div className="absolute bottom-24 right-8 text-3xl animate-pulse duration-700 opacity-70 pointer-events-none">🥳</div>

          {/* Glowing decorated top bar */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/40 animate-pulse">
                <PartyPopper className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-amber-300 flex items-center gap-2">
                  Birthday Celebration Burst 🎉
                </h2>
                <p className="text-xs text-slate-300 font-semibold">Click photo for full size view & trigger fireworks</p>
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
            {/* Member Card Spotlight - Centered Birthday Banner Poster Style */}
            <div className="bg-gradient-to-b from-amber-500/15 via-slate-900 to-indigo-950/60 border-2 border-amber-400/40 rounded-3xl p-6 backdrop-blur-md text-center flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden">
              
              {/* Decorative top ribbon */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg">
                <Crown className="w-4 h-4 text-slate-950" />
                <span>Star of the Day • Happy Birthday</span>
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>

              {/* Centered Photo with Glowing Gold Ring & Zoom Click Handler (Face completely unobstructed) */}
              <div
                onClick={() => setShowFullImage(true)}
                className="relative group cursor-pointer my-2"
                title="Click to view full screen image"
              >
                <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-300 rounded-full blur-sm group-hover:blur-md transition opacity-90 animate-pulse" />
                <img
                  src={photoUrl}
                  alt={member.fullName}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
                  }}
                  className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover object-top border-4 border-amber-300 shadow-2xl group-hover:scale-105 transition-transform"
                />

                {/* Hover Zoom Overlay */}
                <div className="absolute inset-0 bg-slate-950/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-amber-300">
                  <ZoomIn className="w-7 h-7 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Full View</span>
                </div>
              </div>

              {/* Centered Member Info & Badges */}
              <div className="space-y-1.5 w-full flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>{dateStr}</span>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight drop-shadow-md">
                  {member.fullName}
                </h3>
                <p className="text-xs text-rose-300 font-extrabold uppercase tracking-wide">
                  {member.role || 'Youth Member'}
                </p>
                <p className="text-xs text-indigo-200 font-semibold">
                  {member.anbiyamName || 'Sagaya Madha Anbiyam'}
                </p>

                <button
                  onClick={() => setShowFullImage(true)}
                  className="mt-1 text-xs font-extrabold text-amber-400 hover:text-amber-300 underline flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> Click Photo for Full Screen View
                </button>
              </div>

              {/* Animated Candle & Cake Cut Trigger */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cake className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300">
                    {candlesLit ? '🕯️ Candles Lit & Burning' : '✨ Wishes Made & Candles Blown'}
                  </span>
                </div>

                <button
                  onClick={handleToggleCandles}
                  className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition border border-amber-400/40"
                >
                  <Flame className={`w-3.5 h-3.5 ${candlesLit ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                  {candlesLit ? 'Blow Candles' : 'Relight Candles'}
                </button>
              </div>
            </div>

            {/* Fire Fireworks & Confetti Burst Button */}
            <button
              onClick={() => onTriggerBurst?.()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 hover:from-amber-300 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 transition shadow-xl shadow-amber-500/30 active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-slate-950 animate-spin" />
              <span>Fire Fireworks & Particle Confetti Burst 🎉</span>
            </button>

            {/* Blessing Message Selection */}
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
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black'
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
            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-medium text-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">Blessing Message Preview</span>
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
                Send Blessing on WhatsApp ✨
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Photo Lightbox Overlay Modal */}
      {showFullImage && (
        <PhotoLightboxModal
          photoUrl={photoUrl}
          title={`${member.fullName}'s Birthday Celebration Photo`}
          subtitle={`${member.role || 'Youth Member'} • ${dateStr}`}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </>
  );
}
