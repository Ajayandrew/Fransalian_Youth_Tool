import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, Briefcase, Heart, ShieldCheck, QrCode, Printer, CheckCircle2, User, Droplet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings } from '../context/SettingsContext';
import { getImageUrl } from '../utils/urlUtils';

export default function MemberProfileModal({ member, onClose, onOpenIDBadge }) {
  const { settings } = useSettings();
  if (!member) return null;

  const qrValue = JSON.stringify({
    id: member._id,
    name: member.fullName,
    blood: member.bloodGroup,
    mobile: member.mobileNumber,
    anbiyam: member.anbiyamName
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Youth Member Profile Details</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          <img
            src={getImageUrl(member.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300'}
            alt={member.fullName}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300';
            }}
            className="w-24 h-24 rounded-2xl object-cover object-top border-2 border-white shadow-md flex-shrink-0 cursor-pointer hover:opacity-90 transition"
          />
          <div className="space-y-1 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">{member.fullName}</h2>
                <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">Member ID: {member.memberId || 'FY-MEM-001'}</p>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                member.activeStatus === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800'
              }`}>
                {member.activeStatus || 'Active'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                {member.role || 'Youth Member'}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                <Droplet className="w-3 h-3 text-rose-600 fill-rose-600" />
                {member.bloodGroup || 'O+'}
              </span>
              {member.baptismName && (
                <span className="text-xs text-indigo-600 font-bold">Baptism: {member.baptismName}</span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1">{member.anbiyamName || 'Main Parish'} • {member.parish || settings.churchName}</p>
          </div>
        </div>

        {/* Clean Real Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Personal & Contact Info</span>
            </h4>
            <div className="space-y-1.5 text-slate-700">
              <p><span className="text-slate-400 font-medium">Mobile Number:</span> <strong className="text-slate-900">{member.mobileNumber}</strong></p>
              <p><span className="text-slate-400 font-medium">Blood Group:</span> <strong className="text-rose-700 font-extrabold flex items-center gap-1 inline-flex"><Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600" /> {member.bloodGroup || 'O+'}</strong></p>
              <p><span className="text-slate-400 font-medium">Gender:</span> <strong className="text-slate-800">{member.gender || 'Male'}</strong></p>
              <p><span className="text-slate-400 font-medium">Date of Birth:</span> {member.dob || 'N/A'} ({member.age || 0} yrs)</p>
              {member.address && (
                <p><span className="text-slate-400 font-medium">Address:</span> {member.address}</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Youth Membership & Role</span>
            </h4>
            <div className="space-y-1.5 text-slate-700">
              <p><span className="text-slate-400 font-medium">Assigned Role:</span> <strong className="text-amber-700">{member.role || 'Youth Member'}</strong></p>
              <p><span className="text-slate-400 font-medium">Anbiyam:</span> {member.anbiyamName || 'Main Parish'}</p>
              <p><span className="text-slate-400 font-medium">Parish:</span> {settings.churchName || 'St. Mary Cathedral'}</p>
              <div className="pt-1 flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 ${
                  member.activeStatus === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{member.activeStatus || 'Active'} Registered Youth Member</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code & Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-white border border-slate-200 rounded-xl">
              <QRCodeSVG value={qrValue} size={45} />
            </div>
            <span className="text-[11px] text-slate-500 font-mono">ID: {member._id} • Verified Registry</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => { onClose(); if (onOpenIDBadge) onOpenIDBadge(member); }}
              className="flex-1 sm:flex-none py-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Digital ID Badge</span>
            </button>
            <button
              onClick={() => window.print()}
              className="py-2 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <Printer className="w-4 h-4" />
              <span>Print Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
