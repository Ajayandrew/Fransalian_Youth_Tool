import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Printer, ShieldCheck, Download, Sparkles, Phone, Droplet, User, MapPin, CheckCircle2 } from 'lucide-react';
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

// High-Definition Professional ID Badge Generator (Ultra-HD 2400 x 3600 @ 300-600 DPI Print Quality)
const generate2DBadgePNG = async (member, settings) => {
  // Ensure custom typography is fully ready before rasterization
  try {
    if (document.fonts) await document.fonts.ready;
  } catch (e) {
    // fallback
  }

  const SCALE = 3; // 3x Ultra-HD Scaling (2400 x 3600 px) for razor-sharp zoom & print
  const width = 800;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d');

  // Enable high-fidelity bicubic smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(SCALE, SCALE);

  // Background Gradient - Deep Premium Navy / Indigo
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.25, '#1e1b4b');
  gradient.addColorStop(0.65, '#312e81');
  gradient.addColorStop(1, '#090d16');
  ctx.fillStyle = gradient;

  // Rounded Card Base (32px radius)
  const r = 36;
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

  // Outer Border & Glow
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#4f46e5';
  ctx.stroke();

  // Decorative Header Ribbon
  const topGrad = ctx.createLinearGradient(0, 0, width, 0);
  topGrad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
  topGrad.addColorStop(0.5, 'rgba(129, 140, 248, 0.6)');
  topGrad.addColorStop(1, 'rgba(99, 102, 241, 0.4)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 14);

  // 1. HEADER SECTION (Y: 25 to 135)
  const logoSrc = settings.churchLogo ? getImageUrl(settings.churchLogo) : '';
  const logoImg = await loadImg(logoSrc);
  const logoX = 45;
  const logoY = 32;
  const logoSize = 75;

  // Logo Circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (logoImg) {
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  } else {
    ctx.fillStyle = '#4338ca';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((settings.youthName || 'FY').slice(0, 2).toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2);
  }
  ctx.restore();

  // Header Typography
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText((settings.youthName || 'FRANSALIAN YOUTH').toUpperCase(), logoX + logoSize + 20, logoY + 28);

  ctx.fillStyle = '#c7d2fe';
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(settings.churchName || 'St. Mary Cathedral Parish', logoX + logoSize + 20, logoY + 54);

  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('OFFICIAL MEMBERSHIP IDENTITY CARD', logoX + logoSize + 20, logoY + 75);

  // Header Divider Line
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(35, 125);
  ctx.lineTo(width - 35, 125);
  ctx.stroke();

  // 2. PHOTO SECTION (Y: 145 to 445)
  const photoW = 230;
  const photoH = 280;
  const photoX = (width - photoW) / 2;
  const photoY = 150;

  // Photo Outer Frame & Border
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  const pr = 18;
  ctx.beginPath();
  ctx.moveTo(photoX - 6 + pr, photoY - 6);
  ctx.lineTo(photoX + photoW + 6 - pr, photoY - 6);
  ctx.quadraticCurveTo(photoX + photoW + 6, photoY - 6, photoX + photoW + 6, photoY - 6 + pr);
  ctx.lineTo(photoX + photoW + 6, photoY + photoH + 6 - pr);
  ctx.quadraticCurveTo(photoX + photoW + 6, photoY + photoH + 6, photoX + photoW + 6 - pr, photoY + photoH + 6);
  ctx.lineTo(photoX - 6 + pr, photoY + photoH + 6);
  ctx.quadraticCurveTo(photoX - 6, photoY + photoH + 6, photoX - 6, photoY + photoH + 6 - pr);
  ctx.lineTo(photoX - 6, photoY - 6 + pr);
  ctx.quadraticCurveTo(photoX - 6, photoY - 6, photoX - 6 + pr, photoY - 6);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.stroke();

  // Load & Draw Photo (High-Res 800px)
  const photoSrc = getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800';
  const photoImg = await loadImg(photoSrc);

  ctx.save();
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

  // 3. NAME & DESIGNATION (Y: 450 to 570)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(member.fullName || 'Member Name', width / 2, 475);

  // Member ID Badge Pill
  const idText = member.memberId || 'FY-MEM-001';
  ctx.font = 'bold 20px monospace';
  const idMetrics = ctx.measureText(idText);
  const pillW = idMetrics.width + 36;
  const pillH = 34;
  const pillX = (width - pillW) / 2;
  const pillY = 495;

  ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 17);
  ctx.fill();
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fcd34d';
  ctx.fillText(idText, width / 2, pillY + 24);

  // Role & Anbiyam
  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  const roleText = `${(member.role || 'Youth Member').toUpperCase()} • ${member.anbiyamName || 'Main Parish'}`;
  ctx.fillText(roleText, width / 2, 555);

  // 4. MEMBER DETAILS CARD (Y: 580 to 920)
  const boxX = 35;
  const boxY = 575;
  const boxW = width - 70;
  const boxH = 350;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 20);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Detail Rows
  const details = [
    { label: 'Member ID', value: member.memberId || 'FY-MEM-001', isMono: true },
    { label: 'Mobile Number', value: member.mobileNumber || 'N/A' },
    { label: 'Blood Group', value: `🩸 ${member.bloodGroup || 'O+'}`, isBadge: true },
    { label: 'Anbiyam / Unit', value: member.anbiyamName || 'Main Parish' },
    { label: 'Baptism Name', value: member.baptismName || 'N/A' },
    { label: 'Membership Status', value: 'Active Verified Member', isGreen: true }
  ];

  ctx.textAlign = 'left';
  const rowHeight = boxH / details.length;

  details.forEach((item, index) => {
    const rowY = boxY + (index * rowHeight) + (rowHeight / 2) + 6;
    const lineY = boxY + ((index + 1) * rowHeight);

    // Label
    ctx.fillStyle = '#c7d2fe';
    ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(item.label, boxX + 28, rowY);

    // Value
    ctx.textAlign = 'right';
    if (item.isBadge) {
      ctx.fillStyle = '#fcd34d';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.value, boxX + boxW - 28, rowY);
    } else if (item.isGreen) {
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`✓ ${item.value}`, boxX + boxW - 28, rowY);
    } else if (item.isMono) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(item.value, boxX + boxW - 28, rowY);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 19px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.value, boxX + boxW - 28, rowY);
    }
    ctx.textAlign = 'left';

    // Divider Line (except last)
    if (index < details.length - 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(boxX + 20, lineY);
      ctx.lineTo(boxX + boxW - 20, lineY);
      ctx.stroke();
    }
  });

  // 5. FOOTER & QR VERIFICATION (Y: 940 to 1160)
  const footerX = 35;
  const footerY = 945;
  const footerW = width - 70;
  const footerH = 215;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.beginPath();
  ctx.roundRect(footerX, footerY, footerW, footerH, 20);
  ctx.fill();

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Left Verification Text
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('OFFICIAL DIGITAL BADGE', footerX + 25, footerY + 45);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Scan to Verify Records', footerX + 25, footerY + 80);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Fransalian Youth Movement', footerX + 25, footerY + 112);
  ctx.fillText(`Issued: ${new Date().getFullYear()} • Non-Transferable`, footerX + 25, footerY + 138);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`DIGITAL ID: ${member.memberId || member._id}`, footerX + 25, footerY + 175);

  // Right QR Code (drawn from 600px Ultra-HD QR canvas)
  const qrElement = document.querySelector('#badge-qr-hd-wrap canvas') || document.querySelector('#badge-qr-canvas-wrap canvas');
  if (qrElement) {
    const qrSize = 150;
    const qrX = footerX + footerW - qrSize - 25;
    const qrY = footerY + (footerH - qrSize) / 2;

    // White QR Container Card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
    ctx.fill();

    ctx.drawImage(qrElement, qrX, qrY, qrSize, qrSize);
  }

  // Bottom Accent Bar
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0, height - 10, width, 10);

  return canvas.toDataURL('image/png', 1.0);
};

export default function MemberIDCardModal({ member, onClose }) {
  const { settings } = useSettings();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!member) return null;

  const qrValue = JSON.stringify({
    id: member._id,
    memberId: member.memberId,
    name: member.fullName,
    anbiyam: member.anbiyamName,
    role: member.role,
    blood: member.bloodGroup,
    mobile: member.mobileNumber
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadBadge = async () => {
    if (downloading) return;
    setDownloading(true);
    const toastId = toast.loading('Generating professional 300 DPI ID badge...', { id: 'badge-dl' });

    try {
      // Generate clean high-resolution canvas badge
      const imageUrl = await generate2DBadgePNG(member, settings);

      const link = document.createElement('a');
      const cleanName = (member.fullName || 'Member').replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.download = `${cleanName}_Official_ID_Card.png`;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Professional ID Badge Downloaded! 🪪', { id: 'badge-dl' });
    } catch (err) {
      console.error('Failed to download badge:', err);
      toast.error(`Export failed: ${err.message || 'Please use Print Badge option.'}`, { id: 'badge-dl' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-sm sm:max-w-md w-full p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 text-slate-900 my-auto sm:my-6 max-h-[92vh] sm:max-h-[95vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Official Member ID Badge</h3>
              <p className="text-[10px] text-slate-500 font-medium">Standard High-Res Printable ID Card</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Preview Container */}
        <div
          ref={cardRef}
          className="rounded-2xl bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white p-3.5 sm:p-5 pb-5 sm:pb-6 space-y-3 sm:space-y-3.5 shadow-2xl relative border-2 border-indigo-600/60 overflow-hidden"
        >
          {/* Top Decorative Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500" />

          {/* Card Header */}
          <div className="flex items-center space-x-2.5 border-b border-indigo-700/50 pb-2.5 pt-1">
            {settings.churchLogo ? (
              <img
                src={getImageUrl(settings.churchLogo)}
                alt="Logo"
                className="w-10 h-10 rounded-full object-contain bg-white/10 p-0.5 border border-white/20 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 border border-white/30">
                {(settings.youthName || 'FY').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-left min-w-0 flex-1">
              <h4 className="text-xs font-black tracking-wide uppercase leading-tight truncate text-white">
                {settings.youthName || 'Fransalian Youth'}
              </h4>
              <p className="text-[9px] text-indigo-200 font-medium truncate leading-tight">
                {settings.churchName || 'St. Mary Cathedral Parish'}
              </p>
              <p className="text-[8px] text-amber-300 font-bold uppercase tracking-wider mt-0.5">
                Official Membership ID
              </p>
            </div>
          </div>

          {/* Photo & Member Identity */}
          <div className="flex flex-col items-center space-y-2 pt-1">
            <div className="p-1 bg-white/20 rounded-2xl border-2 border-white/60 shadow-xl">
              <img
                src={getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300'}
                alt={member.fullName}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300';
                }}
                className="w-24 h-28 rounded-xl object-cover object-top shadow-inner"
              />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black leading-tight text-white tracking-wide">
                {member.fullName}
              </h3>
              <div className="inline-block px-3 py-0.5 rounded-full bg-indigo-600/50 border border-indigo-400/60 text-amber-300 font-mono font-black text-[11px] tracking-wider shadow-sm">
                {member.memberId || 'FY-MEM-001'}
              </div>
              <div className="text-[10px] text-indigo-200 font-bold">
                <span className="uppercase text-amber-300">{member.role || 'Youth Member'}</span>
                <span className="mx-1">•</span>
                <span>{member.anbiyamName || 'Main Parish'}</span>
              </div>
            </div>
          </div>

          {/* Structured Details Card (No Blank Space) */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl text-[11px] space-y-2 text-slate-100 text-left border border-white/15 shadow-inner">
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
              <span className="text-indigo-200 font-medium">Mobile:</span>
              <span className="text-white font-bold">{member.mobileNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
              <span className="text-indigo-200 font-medium">Blood Group:</span>
              <span className="text-amber-300 font-bold px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/40 text-[10px]">
                🩸 {member.bloodGroup || 'O+'}
              </span>
            </div>
            {member.baptismName && (
              <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                <span className="text-indigo-200 font-medium">Baptism Name:</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{member.baptismName}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
              <span className="text-indigo-200 font-medium">Anbiyam / Unit:</span>
              <span className="text-white font-semibold truncate max-w-[150px]">{member.anbiyamName || 'Main Parish'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-indigo-200 font-medium">Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active Member
              </span>
            </div>
          </div>

          {/* Verification Footer with QR Code */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-2xl border border-indigo-500/30">
            <div className="text-left space-y-0.5">
              <p className="text-[9px] text-sky-400 font-black uppercase tracking-wider">Official Digital Badge</p>
              <p className="text-[10px] text-white font-bold">Scan to Verify</p>
              <p className="text-[8px] text-slate-400 font-mono">ID: {member.memberId || member._id}</p>
            </div>
            <div id="badge-qr-canvas-wrap" className="p-1 bg-white rounded-xl shadow-md flex-shrink-0">
              <QRCodeCanvas value={qrValue} size={52} />
            </div>
          </div>

          {/* Bottom Accent Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex items-center space-x-2.5 no-print">
          <button
            onClick={handleDownloadBadge}
            disabled={downloading}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting...' : 'Download Card (PNG)'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Badge</span>
          </button>
        </div>
        {/* Offscreen 600px High-Resolution QR Canvas for Ultra-Crisp Export */}
        <div id="badge-qr-hd-wrap" style={{ position: 'fixed', left: '-99999px', top: '-99999px', pointerEvents: 'none' }} aria-hidden="true">
          <QRCodeCanvas value={qrValue} size={600} level="H" includeMargin={false} />
        </div>
      </div>
    </div>
  );
}

