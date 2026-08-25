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
  const height = 1680;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.3, '#1e1b4b');
  gradient.addColorStop(0.7, '#312e81');
  gradient.addColorStop(1, '#020617');
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

  // Card Outer Border
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#6366f1';
  ctx.stroke();

  // Header Divider Line
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
  const logoSize = 95;

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
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((settings.youthName || 'FY').slice(0, 2).toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2);
  }
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((settings.youthName || 'FRANSALIAN YOUTH').toUpperCase(), logoX + logoSize + 30, logoY + 45);

  ctx.fillStyle = '#c7d2fe';
  ctx.font = '24px sans-serif';
  ctx.fillText(settings.churchName || 'St. Mary Cathedral Parish', logoX + logoSize + 30, logoY + 85);

  // Passport Size Photo (3:4 Aspect Ratio - 255px Width x 340px Height)
  const photoW = 255;
  const photoH = 340;
  const photoX = (width - photoW) / 2;
  const photoY = 195;

  // Photo Outer Frame Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  const frameMargin = 12;
  ctx.beginPath();
  const fr = 24;
  ctx.moveTo(photoX - frameMargin + fr, photoY - frameMargin);
  ctx.lineTo(photoX + photoW + frameMargin - fr, photoY - frameMargin);
  ctx.quadraticCurveTo(photoX + photoW + frameMargin, photoY - frameMargin, photoX + photoW + frameMargin, photoY - frameMargin + fr);
  ctx.lineTo(photoX + photoW + frameMargin, photoY + photoH + frameMargin - fr);
  ctx.quadraticCurveTo(photoX + photoW + frameMargin, photoY + photoH + frameMargin, photoX + photoW + frameMargin - fr, photoY + photoH + frameMargin);
  ctx.lineTo(photoX - frameMargin + fr, photoY + photoH + frameMargin);
  ctx.quadraticCurveTo(photoX - frameMargin, photoY + photoH + frameMargin, photoX - frameMargin, photoY + photoH + frameMargin - fr);
  ctx.lineTo(photoX - frameMargin, photoY - frameMargin + fr);
  ctx.quadraticCurveTo(photoX - frameMargin, photoY - frameMargin, photoX - frameMargin + fr, photoY - frameMargin);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Draw Photo
  const photoSrc = getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300';
  const photoImg = await loadImg(photoSrc);

  ctx.save();
  const pr = 18;
  ctx.beginPath();
  ctx.moveTo(photoX + pr, photoY);
  ctx.lineTo(photoX + photoW - pr, photoY);
  ctx.quadraticCurveTo(photoX + photoW, photoY, photoX + photoW, photoY + pr);
  ctx.lineTo(photoX + photoW, photoY + photoH - pr);
  ctx.quadraticCurveTo(photoX + photoW, photoY + photoH, photoX + photoW - pr, photoY + photoH);
  ctx.lineTo(photoX + pr, photoY + photoH);
  ctx.quadraticCurveTo(photoX, photoY + photoH, photoX, photoY + photoH - pr);
  ctx.lineTo(photoX, photoY + pr);
  ctx.quadraticCurveTo(photoX, photoY, photoX + pr, photoY);
  ctx.closePath();
  ctx.clip();

  if (photoImg) {
    ctx.drawImage(photoImg, photoX, photoY, photoW, photoH);
  }
  ctx.restore();

  // Name & Role Badge
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText(member.fullName || 'Member Name', width / 2, photoY + photoH + 60);

  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`${(member.role || 'Youth Member').toUpperCase()} • ${member.anbiyamName || 'Main Parish'}`, width / 2, photoY + photoH + 105);

  // Details Box
  const boxX = 60;
  const boxY = photoY + photoH + 135;
  const boxW = width - 120;
  const boxH = 320;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  const br = 28;
  ctx.moveTo(boxX + br, boxY);
  ctx.lineTo(boxX + boxW - br, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + br);
  ctx.lineTo(boxX + boxW, boxY + boxH - br);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - br, boxY + boxH);
  ctx.lineTo(boxX + br, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - br);
  ctx.lineTo(boxX, boxY + br);
  ctx.quadraticCurveTo(boxX, boxY, boxX + br, boxY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '26px sans-serif';
  const startY = boxY + 60;
  const gapY = 54;

  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Member ID:', boxX + 40, startY);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(member.memberId || 'FY-MEM-001', boxX + 270, startY);

  ctx.font = '26px sans-serif';
  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Baptism Name:', boxX + 40, startY + gapY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(member.baptismName || 'Francis', boxX + 270, startY + gapY);

  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Mobile Number:', boxX + 40, startY + gapY * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(member.mobileNumber || 'N/A', boxX + 270, startY + gapY * 2);

  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Blood Group:', boxX + 40, startY + gapY * 3);
  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(member.bloodGroup || 'O+', boxX + 270, startY + gapY * 3);

  ctx.fillStyle = '#c7d2fe';
  ctx.font = '26px sans-serif';
  ctx.fillText('Anbiyam / Parish:', boxX + 40, startY + gapY * 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(member.anbiyamName || 'Main Parish', boxX + 270, startY + gapY * 4);

  // QR Code
  const qrElement = document.querySelector('#badge-qr-canvas-wrap canvas');
  if (qrElement) {
    const qrSize = 210;
    const qrX = (width - qrSize) / 2;
    const qrY = boxY + boxH + 35;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
    ctx.drawImage(qrElement, qrX, qrY, qrSize, qrSize);

    ctx.fillStyle = '#c7d2fe';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`OFFICIAL VERIFIED BADGE • ID: ${member.memberId || member._id}`, width / 2, qrY + qrSize + 50);
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
        <div ref={cardRef} className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-950 text-white space-y-4 shadow-xl text-center relative border border-indigo-700">
          {/* Header */}
          <div className="flex items-center justify-center space-x-2 border-b border-indigo-700/60 pb-2.5">
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

          {/* Standard ID Card Photo (w-24 h-30 - 96px Width x 120px Height) */}
          <div className="flex flex-col items-center space-y-2 pt-1">
            <div className="p-1 bg-white/20 rounded-2xl border border-white/40 shadow-lg">
              <img
                src={getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300'}
                alt={member.fullName}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300';
                }}
                className="w-24 h-30 rounded-xl object-cover object-top shadow-inner"
              />
            </div>

            <div className="text-center space-y-0.5 pt-1">
              <h3 className="text-base font-black leading-tight text-white tracking-wide">{member.fullName}</h3>
              <p className="text-xs font-mono font-extrabold text-indigo-200 tracking-wider">{member.memberId || 'FY-MEM-001'}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-extrabold uppercase mt-1">
                <span>{member.role || 'Youth Member'}</span>
                <span>•</span>
                <span>{member.anbiyamName || 'Main Parish'}</span>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl text-[11px] space-y-2 text-slate-100 text-left border border-white/15 shadow-inner">
            <div className="flex justify-between items-center border-b border-white/10 pb-1">
              <span className="text-indigo-200 font-medium">Member ID</span>
              <strong className="text-white font-mono font-black text-xs">{member.memberId || 'FY-MEM-001'}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-1">
              <span className="text-indigo-200 font-medium">Baptism Name</span>
              <span className="text-white font-semibold">{member.baptismName || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-1">
              <span className="text-indigo-200 font-medium">Mobile Number</span>
              <span className="text-white font-semibold">{member.mobileNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-1">
              <span className="text-indigo-200 font-medium">Blood Group</span>
              <strong className="text-amber-300 font-black text-xs px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30">
                🩸 {member.bloodGroup || 'O+'}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-indigo-200 font-medium">Anbiyam / Parish</span>
              <span className="text-indigo-100 font-medium truncate max-w-[160px]">{member.anbiyamName || 'Main Parish'}</span>
            </div>
          </div>

          {/* Footer QR Verification */}
          <div className="pt-1 flex flex-col items-center space-y-1">
            <div id="badge-qr-canvas-wrap" className="p-2 bg-white rounded-xl shadow-md border border-indigo-200">
              <QRCodeCanvas value={qrValue} size={72} />
            </div>
            <p className="text-[9px] text-indigo-200 font-mono tracking-wider font-bold">OFFICIAL VERIFIED BADGE • ID: {member.memberId || member._id}</p>
          </div>
        </div>

        {/* Action Buttons */}
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
