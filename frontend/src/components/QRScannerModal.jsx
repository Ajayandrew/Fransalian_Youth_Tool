import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, X, CheckCircle2, AlertCircle, RefreshCw, Volume2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

// Web Audio API Beep Generator for instant physical scan feedback
const playScanBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz pitch (A5 note)
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15); // 150ms crisp beep
  } catch (e) {}
};

export default function QRScannerModal({ isOpen, onClose, members = [], attendanceRecords = {}, setAttendanceRecords }) {
  const [manualInput, setManualInput] = useState('');
  const [lastScannedMember, setLastScannedMember] = useState(null);
  const [recentScanLog, setRecentScanLog] = useState([]);
  const scannerRef = useRef(null);

  const processScannedCode = (rawText) => {
    if (!rawText) return;
    const cleanText = rawText.trim();

    // 1. Try JSON parsing if QR contains encoded object
    let targetMemberId = cleanText;
    let targetFullName = cleanText;

    try {
      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        const parsed = JSON.parse(cleanText);
        targetMemberId = parsed.memberId || parsed.id || parsed._id || cleanText;
        targetFullName = parsed.fullName || parsed.name || cleanText;
      }
    } catch (e) {}

    // 2. Lookup matching member in directory
    const matched = members.find(m => 
      (m.memberId && m.memberId.toLowerCase() === targetMemberId.toLowerCase()) ||
      (m._id && m._id === targetMemberId) ||
      (m.fullName && m.fullName.toLowerCase() === targetFullName.toLowerCase()) ||
      (m.mobileNumber && m.mobileNumber === cleanText)
    );

    if (matched) {
      // Mark member PRESENT
      setAttendanceRecords(prev => ({
        ...prev,
        [matched._id]: 'Present'
      }));

      playScanBeep();
      setLastScannedMember(matched);
      setRecentScanLog(prev => [
        { id: matched._id, name: matched.fullName, memberId: matched.memberId, time: new Date().toLocaleTimeString() },
        ...prev.filter(item => item.id !== matched._id).slice(0, 4)
      ]);

      toast.success(`✅ PRESENT: ${matched.fullName} (${matched.memberId})`, { id: `scan_${matched._id}` });
    } else {
      toast.error(`No matching member found for QR code: ${cleanText}`, { id: `scan_err_${cleanText.slice(0, 10)}` });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let scannerInstance = null;
    const timer = setTimeout(() => {
      try {
        scannerInstance = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 1.5,
            rememberLastUsedCamera: true,
            supportedScanTypes: []
          },
          /* verbose= */ false
        );

        scannerInstance.render(
          (decodedText) => {
            processScannedCode(decodedText);
          },
          (errorMessage) => {
            // Suppress frame scan warning spam
          }
        );

        scannerRef.current = scannerInstance;
      } catch (err) {
        console.warn('QR Scanner init error:', err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, [isOpen]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput) return;
    processScannedCode(manualInput);
    setManualInput('');
  };

  if (!isOpen) return null;

  const presentCount = Object.values(attendanceRecords).filter(s => s === 'Present').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 relative my-8">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Mobile QR Camera Check-In</h3>
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {presentCount} Members Present
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Scanner Feed Container */}
        <div className="space-y-2">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-600/30 min-h-[260px] flex items-center justify-center">
            <div id="qr-reader" className="w-full text-white text-xs" />
          </div>
          <p className="text-[11px] font-medium text-slate-500 text-center">
            Point mobile camera at youth member ID card QR code. Camera automatically marks PRESENT instantly on scan.
          </p>
        </div>

        {/* Last Scanned Feedback Banner */}
        {lastScannedMember && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900">{lastScannedMember.fullName}</p>
                <p className="text-[10px] font-semibold text-emerald-700">{lastScannedMember.memberId} • Marked PRESENT ✅</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-white/60 px-2 py-0.5 rounded-md">Just Now</span>
          </div>
        )}

        {/* Manual ID Input & Bluetooth Scanner Input */}
        <form onSubmit={handleManualSubmit} className="space-y-2 pt-1 border-t border-slate-100">
          <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
            Manual Search or External Scanner Gun
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Scan or type Member ID (e.g. FY-MEM-001)"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
            >
              Mark Present
            </button>
          </div>
        </form>

        {/* Recent Scan History Stream */}
        {recentScanLog.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Session Scan Feed ({recentScanLog.length})</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {recentScanLog.map(item => (
                <div key={item.id} className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-700 font-medium">
                  <span className="font-bold text-slate-900">{item.name} ({item.memberId})</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">PRESENT • {item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
          >
            Done Scanning (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
