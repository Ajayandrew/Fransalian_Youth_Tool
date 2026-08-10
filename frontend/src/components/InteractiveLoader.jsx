import React, { useState, useEffect } from 'react';
import { Sparkles, Church, Loader2, ShieldCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function InteractiveLoader({ message = 'Loading, Please Wait...', fullScreen = false }) {
  const { settings } = useSettings();
  const [subMessageIndex, setSubMessageIndex] = useState(0);

  const subMessages = [
    'Connecting to Fransalian Youth Database...',
    'Syncing youth directory & accounts ledger...',
    'Preparing interactive dashboard & celebrations...',
    'Almost ready, thank you for waiting!'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSubMessageIndex(prev => (prev + 1) % subMessages.length);
    }, 2200);

    return () => clearInterval(timer);
  }, []);

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4'
    : 'py-20 px-6 flex flex-col items-center justify-center text-center';

  return (
    <div className={containerClasses}>
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-6 relative overflow-hidden text-white">
        
        {/* Background Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Centered Crest Icon with Spinning Ring */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-amber-400 animate-spin duration-700" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/40 text-white animate-pulse">
            <Church className="w-7 h-7" />
          </div>
        </div>

        {/* Loading Message Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>{settings.youthName || 'Fransalian Youth'}</span>
          </div>
          
          <h3 className="text-xl font-black text-white tracking-tight">
            {message}
          </h3>

          <p className="text-xs text-indigo-200 font-semibold h-5 transition-all duration-300">
            {subMessages[subMessageIndex]}
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 h-full rounded-full animate-progress" />
        </div>

        {/* Footer Security Badge */}
        <div className="pt-2 text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secure Encrypted System Connection</span>
        </div>
      </div>
    </div>
  );
}
