import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, ShieldCheck, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getImageUrl } from '../utils/urlUtils';

export default function MemberIDCardModal({ member, onClose }) {
  const { settings } = useSettings();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!member) return null;

  const qrValue = JSON.stringify({
    id: member._id,
    name: member.fullName,
    anbiyam: member.anbiyamName,
    mobile: member.mobileNumber
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadBadge = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    const toastId = toast.loading('Generating high resolution ID badge...', { id: 'badge-dl' });

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false
      });

      const imageUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const cleanName = (member.fullName || 'Member').replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.download = `${cleanName}_Youth_ID_Badge.png`;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('ID Badge Downloaded!', { id: 'badge-dl' });
    } catch (err) {
      console.error('Failed to download badge:', err);
      toast.error('Download failed. You can use Print ID Card option.', { id: 'badge-dl' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold">Youth Official ID Badge</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div ref={cardRef} className="p-5 rounded-2xl bg-gradient-to-b from-indigo-900 via-indigo-800 to-slate-900 text-white space-y-4 shadow-md text-center relative border border-indigo-700">
          <div className="flex items-center justify-center space-x-2 border-b border-indigo-700/60 pb-2">
            {settings.churchLogo ? (
              <img src={getImageUrl(settings.churchLogo)} alt="Logo" className="w-8 h-8 rounded-full object-contain flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 text-white font-black text-xs flex items-center justify-center flex-shrink-0 border border-white/30">
                {(settings.youthName || 'FY').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-left truncate">
              <h4 className="text-xs font-black tracking-wide uppercase leading-tight truncate">{settings.youthName || 'Francisalian Youth'}</h4>
              <p className="text-[9px] text-indigo-200 font-medium truncate">{settings.churchName || 'St. Mary Cathedral Parish'}</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <img
              src={getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300'}
              alt={member.fullName}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300';
              }}
              className="w-20 h-20 rounded-2xl object-cover object-top border-2 border-white/80 shadow-md"
            />
            <div>
              <h3 className="text-base font-black leading-tight text-white">{member.fullName}</h3>
              <p className="text-[11px] text-indigo-200 font-mono font-bold mt-0.5">{member.memberId || 'FY-MEM-001'}</p>
              <p className="text-xs text-amber-300 font-extrabold mt-0.5 uppercase tracking-wider">{member.role || 'Youth Member'} • {member.anbiyamName || 'Main Parish'}</p>
            </div>
          </div>

          <div className="bg-white/10 p-2.5 rounded-xl text-[11px] space-y-1 text-slate-100 backdrop-blur-sm text-left">
            <p><span className="text-indigo-200 font-medium">Member ID:</span> <strong className="text-white font-mono">{member.memberId || 'FY-MEM-001'}</strong></p>
            <p><span className="text-indigo-200 font-medium">Baptism Name:</span> {member.baptismName || 'Francis'}</p>
            <p><span className="text-indigo-200 font-medium">Mobile:</span> {member.mobileNumber}</p>
            <p><span className="text-indigo-200 font-medium">Blood Group:</span> <strong className="text-amber-300">{member.bloodGroup || 'O+'}</strong></p>
          </div>

          <div className="pt-2 flex flex-col items-center space-y-1">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <QRCodeSVG value={qrValue} size={70} />
            </div>
            <p className="text-[10px] text-indigo-200 font-mono tracking-wider font-bold">ID: {member.memberId || member._id}</p>
          </div>
        </div>

        <div className="pt-2 flex items-center space-x-2 no-print">
          <button
            onClick={handleDownloadBadge}
            disabled={downloading}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting...' : 'Download Badge'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
