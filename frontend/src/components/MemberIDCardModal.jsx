import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Printer, ShieldCheck, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getImageUrl } from '../utils/urlUtils';

const loadImg = (src) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => resolve(null);
      fallbackImg.src = src;
    };
    img.src = src;
  });
};

// 100% Guaranteed 2D Canvas Drawer (High-Res 300 DPI PNG)
const generate2DBadgePNG = async (member, settings) => {
  const width = 1080;
  const height = 1560;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1e1b4b');
  gradient.addColorStop(0.5, '#312e81');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;

  // Rounded Card Base
  const r = 48;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(width - r, 0);
  ctx.quadraticCurveTo(width, 0, width, r);
  ctx.lineTo(width, height - r);
  ctx.quadraticCurveTo(width, height, width - r, height);
  ctx.lineTo(r, height);
  ctx.quadraticCurveTo(0, height, 0, height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Card Border
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#4338ca';
  ctx.stroke();

  // Header Line
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(50, 160);
  ctx.lineTo(width - 50, 160);
  ctx.stroke();

  // Header Logo / Text
  const logoSrc = settings.churchLogo ? getImageUrl(settings.churchLogo) : '';
  const logoImg = await loadImg(logoSrc);
  const logoX = 60;
  const logoY = 40;
  const logoSize = 90;

  ctx.save();
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (logoImg) {
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((settings.youthName || 'FY').slice(0, 2).toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2);
  }
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((settings.youthName || 'FRANSALIAN YOUTH').toUpperCase(), logoX + logoSize + 30, logoY + 42);

  ctx.fillStyle = '#c7d2fe';
  ctx.font = '24px sans-serif';
  ctx.fillText(settings.churchName || 'St. Mary Cathedral Parish', logoX + logoSize + 30, logoY + 80);

  // Profile Photo
  const photoSrc = getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300';
  const photoImg = await loadImg(photoSrc);
  const photoSize = 250;
  const photoX = (width - photoSize) / 2;
  const photoY = 210;

  ctx.save();
  const pr = 44;
  ctx.beginPath();
  ctx.moveTo(photoX + pr, photoY);
  ctx.lineTo(photoX + photoSize - pr, photoY);
  ctx.quadraticCurveTo(photoX + photoSize, photoY, photoX + photoSize, photoY + pr);
  ctx.lineTo(photoX + photoSize, photoY + photoSize - pr);
  ctx.quadraticCurveTo(photoX + photoSize, photoY + photoSize, photoX + photoSize - pr, photoY + photoSize);
  ctx.lineTo(photoX + pr, photoY + photoSize);
  ctx.quadraticCurveTo(photoX, photoY + photoSize, photoX, photoY + photoSize - pr);
  ctx.lineTo(photoX, photoY + pr);
  ctx.quadraticCurveTo(photoX, photoY, photoX + pr, photoY);
  ctx.closePath();
  ctx.clip();

  if (photoImg) {
    ctx.drawImage(photoImg, photoX, photoY, photoSize, photoSize);
  }
  ctx.restore();

  ctx.lineWidth = 8;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Name & Role
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText(member.fullName || 'Member Name', width / 2, photoY + photoSize + 65);

  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`${(member.role || 'Youth Member').toUpperCase()} • ${member.anbiyamName || 'Main Parish'}`, width / 2, photoY + photoSize + 110);

  // Details Box
  const boxX = 60;
  const boxY = photoY + photoSize + 145;
  const boxW = width - 120;
  const boxH = 270;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(boxX + 24, boxY);
  ctx.lineTo(boxX + boxW - 24, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + 24);
  ctx.lineTo(boxX + boxW, boxY + boxH - 24);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - 24, boxY + boxH);
  ctx.lineTo(boxX + 24, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - 24);
  ctx.lineTo(boxX, boxY + 24);
  ctx.quadraticCurveTo(boxX, boxY, boxX + 24, boxY);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = '26px sans-serif';
  const startY = boxY + 55;
  const gapY = 50;

  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Member ID:', boxX + 35, startY);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(member.memberId || 'FY-MEM-001', boxX + 230, startY);

  ctx.font = '26px sans-serif';
  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Baptism Name:', boxX + 35, startY + gapY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(member.baptismName || 'Francis', boxX + 230, startY + gapY);

  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Mobile Number:', boxX + 35, startY + gapY * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(member.mobileNumber || 'N/A', boxX + 230, startY + gapY * 2);

  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Blood Group:', boxX + 35, startY + gapY * 3);
  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(member.bloodGroup || 'O+', boxX + 230, startY + gapY * 3);

  // QR Code
  const qrElement = document.querySelector('#badge-qr-canvas-wrap canvas');
  if (qrElement) {
    const qrSize = 200;
    const qrX = (width - qrSize) / 2;
    const qrY = boxY + boxH + 35;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
    ctx.drawImage(qrElement, qrX, qrY, qrSize, qrSize);

    ctx.fillStyle = '#c7d2fe';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ID: ${member.memberId || member._id}`, width / 2, qrY + qrSize + 45);
  }

  return canvas.toDataURL('image/png', 1.0);
};

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
    if (downloading) return;
    setDownloading(true);
    const toastId = toast.loading('Generating high resolution ID badge...', { id: 'badge-dl' });

    try {
      let imageUrl = '';

      // Primary: html2canvas
      if (cardRef.current) {
        try {
          const canvas = await html2canvas(cardRef.current, {
            scale: 3,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false
          });
          imageUrl = canvas.toDataURL('image/png', 1.0);
        } catch (e) {
          console.warn('html2canvas failed, falling back to 2D Canvas Engine:', e);
        }
      }

      // Fallback: Guaranteed 2D Canvas Engine
      if (!imageUrl || imageUrl === 'data:,') {
        imageUrl = await generate2DBadgePNG(member, settings);
      }

      const link = document.createElement('a');
      const cleanName = (member.fullName || 'Member').replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.download = `${cleanName}_Youth_ID_Badge.png`;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Member ID Badge Downloaded!', { id: 'badge-dl' });
    } catch (err) {
      console.error('Failed to download badge:', err);
      toast.error(`Export failed: ${err.message || 'Please use Print Badge option.'}`, { id: 'badge-dl' });
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
              <img
                src={getImageUrl(settings.churchLogo)}
                alt="Logo"
                className="w-8 h-8 rounded-full object-contain flex-shrink-0"
              />
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

          <div className="bg-white/15 p-2.5 rounded-xl text-[11px] space-y-1 text-slate-100 text-left border border-white/10">
            <p><span className="text-indigo-200 font-medium">Member ID:</span> <strong className="text-white font-mono">{member.memberId || 'FY-MEM-001'}</strong></p>
            <p><span className="text-indigo-200 font-medium">Baptism Name:</span> {member.baptismName || 'Francis'}</p>
            <p><span className="text-indigo-200 font-medium">Mobile:</span> {member.mobileNumber}</p>
            <p><span className="text-indigo-200 font-medium">Blood Group:</span> <strong className="text-amber-300">{member.bloodGroup || 'O+'}</strong></p>
          </div>

          <div className="pt-2 flex flex-col items-center space-y-1">
            <div id="badge-qr-canvas-wrap" className="p-2 bg-white rounded-xl shadow-sm">
              <QRCodeCanvas value={qrValue} size={70} />
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
