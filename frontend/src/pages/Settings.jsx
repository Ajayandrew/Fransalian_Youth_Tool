import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Save, Database, Shield, DollarSign, Church, KeyRound, Mail, UserCheck, Lock, Upload, Download, Share2, Youtube, Facebook, Instagram, Image as ImageIcon, Sparkles, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import PhotoLightboxModal from '../components/PhotoLightboxModal';
import { getImageUrl } from '../utils/urlUtils';

export default function Settings() {
  const { user, hasRole, updateUserProfile } = useAuth();
  const { settings: globalSettings, updateSettings: updateGlobalSettings } = useSettings();

  const [settings, setSettings] = useState({ ...globalSettings });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(globalSettings.churchLogo || '');
  const [showLogoModal, setShowLogoModal] = useState(false);

  const [priestFile, setPriestFile] = useState(null);
  const [priestPreview, setPriestPreview] = useState(globalSettings.parishPriestPhoto || '');

  const [savingSettings, setSavingSettings] = useState(false);

  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileBloodGroup, setProfileBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const canEdit = hasRole(['Admin']);

  const handleDownloadCrestLogo = async () => {
    const targetUrl = logoPreview || getImageUrl(settings.churchLogo);
    if (!targetUrl) return;
    try {
      toast.loading('Preparing Crest Logo download...', { id: 'logo-dl' });
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = (settings.churchName || 'Church_Crest').replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.download = `${cleanName}_Crest_Logo.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Crest Logo Downloaded!', { id: 'logo-dl' });
    } catch (err) {
      window.open(targetUrl, '_blank');
      toast.success('Opened Crest Logo in new tab!', { id: 'logo-dl' });
    }
  };

  useEffect(() => {
    if (user?.email) setProfileEmail(user.email);
    if (user?.bloodGroup) setProfileBloodGroup(user.bloodGroup);
  }, [user]);

  useEffect(() => {
    setSettings({ ...globalSettings });
    setLogoPreview(globalSettings.churchLogo ? getImageUrl(globalSettings.churchLogo) : '');
    setPriestPreview(globalSettings.parishPriestPhoto ? getImageUrl(globalSettings.parishPriestPhoto) : '');
  }, [globalSettings]);

  const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!canEdit) return toast.error('Only Admin can update organization settings.');

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));

    const loadingToast = toast.loading('Uploading Church logo...');
    try {
      const payload = new FormData();
      Object.keys(settings).forEach(key => {
        if (key === '_id' || key === 'createdAt' || key === 'updatedAt' || key === '__v') return;
        if (key === 'churchLogo' || key === 'parishPriestPhoto') return;
        payload.append(key, settings[key]);
      });
      payload.append('churchLogo', file);
      const res = await updateGlobalSettings(payload);
      toast.dismiss(loadingToast);
      if (res && res.settings && res.settings.churchLogo) {
        setLogoPreview(getImageUrl(res.settings.churchLogo));
      }
      toast.success('Church logo uploaded successfully!');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to upload logo.');
    }
  };

  const handlePriestFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!canEdit) return toast.error('Only Admin can update organization settings.');

    setPriestFile(file);
    setPriestPreview(URL.createObjectURL(file));

    const loadingToast = toast.loading('Uploading Priest photo...');
    try {
      const payload = new FormData();
      Object.keys(settings).forEach(key => {
        if (key === '_id' || key === 'createdAt' || key === 'updatedAt' || key === '__v') return;
        if (key === 'churchLogo' || key === 'parishPriestPhoto') return;
        payload.append(key, settings[key]);
      });
      payload.append('parishPriestPhoto', file);
      const res = await updateGlobalSettings(payload);
      toast.dismiss(loadingToast);
      if (res && res.settings && res.settings.parishPriestPhoto) {
        setPriestPreview(getImageUrl(res.settings.parishPriestPhoto));
      }
      toast.success('Priest photo uploaded successfully!');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to upload Priest photo.');
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!canEdit) return toast.error('Only Admin can update organization settings.');

    const loadingToast = toast.loading('Saving Organization Settings...');
    setSavingSettings(true);

    try {
      if (logoFile || priestFile) {
        const payload = new FormData();
        Object.keys(settings).forEach(key => {
          if (key === '_id' || key === 'createdAt' || key === 'updatedAt' || key === '__v') return;
          if (key === 'churchLogo' && logoFile) return;
          if (key === 'parishPriestPhoto' && priestFile) return;
          if (settings[key] !== null && settings[key] !== undefined) {
            if (Array.isArray(settings[key])) {
              payload.append(key, settings[key].join(','));
            } else {
              payload.append(key, settings[key]);
            }
          }
        });
        if (logoFile) payload.append('churchLogo', logoFile);
        if (priestFile) payload.append('parishPriestPhoto', priestFile);
        await updateGlobalSettings(payload);
      } else {
        const cleanSettings = { ...settings };
        delete cleanSettings._id;
        delete cleanSettings.createdAt;
        delete cleanSettings.updatedAt;
        delete cleanSettings.__v;
        await updateGlobalSettings(cleanSettings);
      }
      toast.dismiss(loadingToast);
      toast.success('Organization Settings saved successfully!');
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Settings save error:', err);
      toast.error(err.response?.data?.message || 'Failed to update organization settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileEmail) return toast.error('Email address cannot be empty.');
    try {
      await updateUserProfile(profileEmail, newPasswordInput, profileBloodGroup);
      setNewPasswordInput('');
    } catch (err) {
      toast.error('Failed to update credentials.');
    }
  };

  const handleResetAllData = async () => {
    if (!window.confirm('⚠️ Are you sure you want to DELETE ALL stored data (subscriptions, accounts, events, attendance)? This action cannot be undone!')) return;
    try {
      const res = await axios.post('/api/settings/reset-data');
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'All stored data deleted cleanly!');
      }
    } catch (err) {
      toast.error('Failed to reset data.');
    }
  };

  if (!canEdit) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Admin Privileges Required</h2>
          <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
            System Settings & Organization Configuration options are reserved exclusively for <strong>Father / Super Admin</strong>.
          </p>
          <div className="pt-2">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              Current Active Role: {user?.fullName} ({user?.role})
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <SettingsIcon className="w-6 h-6" />
            </div>
            System & Account Settings
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Update your profile blood group, login Email & Password, parish organization details, and database tools.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleSave}
            disabled={savingSettings}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/30 cursor-pointer disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
          </button>
        )}
      </div>

      {/* Role Profile Credentials Card (Available to All Roles) */}
      <div className="bg-white rounded-3xl border border-indigo-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" /> My Role Account Security ({user?.role || 'Office Bearer'})
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Change your custom login Email address / User ID and Password.
            </p>
          </div>
          <span className="text-xs font-extrabold uppercase px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
            {user?.role || 'Office Bearer'}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 mb-1">My Login Email / User ID</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="myname@church.org"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">New Password (leave blank to keep unchanged)</label>
              <div className="relative">
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" /> Update My Email & Password
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Church className="w-4 h-4 text-indigo-600" /> Organization & Parish Profile
          </h2>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden cursor-pointer group"
                onClick={() => (logoPreview || settings.churchLogo) && setShowLogoModal(true)}
                title={(logoPreview || settings.churchLogo) ? "Click to view full size logo" : ""}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Parish Logo" className="w-full h-full object-contain rounded-full group-hover:scale-105 transition-transform" />
                ) : (
                  <Church className="w-8 h-8 text-indigo-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Church / Association Logo</h4>
                <p className="text-[11px] text-slate-500 font-medium">Upload custom crest image or paste direct image URL</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(logoPreview || settings.churchLogo) && (
                <button
                  type="button"
                  onClick={handleDownloadCrestLogo}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Crest Logo</span>
                </button>
              )}

              {canEdit && (
                <label className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-sm transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo File</span>
                  <input type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 mb-1">Parish / Church Name *</label>
              <input
                type="text"
                disabled={!canEdit}
                required
                value={settings.churchName || ''}
                onChange={(e) => setSettings({ ...settings, churchName: e.target.value })}
                placeholder="e.g. St. Mary Cathedral Parish"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Youth Association Name *</label>
              <input
                type="text"
                disabled={!canEdit}
                required
                value={settings.youthName || ''}
                onChange={(e) => setSettings({ ...settings, youthName: e.target.value })}
                placeholder="e.g. Fransalian Youth Movement"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Parish Street Address</label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="e.g. 12 Cathedral Road, Santhome"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={settings.city || ''}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  placeholder="Chennai"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Pincode</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={settings.pincode || ''}
                  onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                  placeholder="600004"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Contact Email</label>
              <input
                type="email"
                disabled={!canEdit}
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Contact Phone</label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Parish Priest Details Setup */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600" /> Parish Priest Profile & Highlight Setup
          </h2>
          <p className="text-xs text-slate-500 font-medium">Configure the Parish Priest / Spiritual Director name, title, photo, and phone to display on the Dashboard.</p>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-amber-300 flex items-center justify-center overflow-hidden shadow-xs">
                {priestPreview ? (
                  <img src={priestPreview} alt="Parish Priest" className="w-full h-full object-cover object-top" />
                ) : (
                  <UserCheck className="w-8 h-8 text-amber-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">{settings.parishPriestName || 'Rev. Fr. Parish Priest'}</h4>
                <p className="text-[11px] text-amber-800 font-medium">{settings.parishPriestTitle || 'Parish Priest / Spiritual Director'}</p>
              </div>
            </div>

            {canEdit && (
              <label className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-sm transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Priest Photo</span>
                <input type="file" accept="image/*" name="parishPriestPhoto" onChange={handlePriestFileChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 mb-1">Parish Priest Full Name</label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.parishPriestName || ''}
                onChange={(e) => setSettings({ ...settings, parishPriestName: e.target.value })}
                placeholder="e.g. Rev. Fr. Anthony Raj"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Designation / Title</label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.parishPriestTitle || ''}
                onChange={(e) => setSettings({ ...settings, parishPriestTitle: e.target.value })}
                placeholder="e.g. Parish Priest / Youth Director"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Priest Direct Mobile / Contact</label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.parishPriestPhone || ''}
                onChange={(e) => setSettings({ ...settings, parishPriestPhone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Social Media Channels Links Setup */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-600" /> Official Social Media Handles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 mb-1 flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-rose-600" /> YouTube Channel Link
              </label>
              <input
                type="url"
                disabled={!canEdit}
                value={settings.youtubeUrl || ''}
                onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/@fransalianyouth"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 flex items-center gap-1.5">
                <Facebook className="w-4 h-4 text-blue-600" /> Facebook Page Link
              </label>
              <input
                type="url"
                disabled={!canEdit}
                value={settings.facebookUrl || ''}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/fransalianyouth"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-pink-600" /> Instagram Profile Link
              </label>
              <input
                type="url"
                disabled={!canEdit}
                value={settings.instagramUrl || ''}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/fransalianyouth"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Automated SMS Gateway Configuration Card */}
        <div className="bg-white rounded-3xl border border-sky-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-sky-600 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" /> Automated SMS Gateway Setup (Fast2SMS / Twilio)
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Automatically send instant SMS payment receipts & notifications to member mobile numbers.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              {settings.fast2smsApiKey ? '🟢 Gateway Active' : '⚪ Setup Required'}
            </span>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 mb-1">SMS Provider</label>
                <select
                  disabled={!canEdit}
                  value={settings.smsProvider || 'fast2sms'}
                  onChange={(e) => setSettings({ ...settings, smsProvider: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none font-bold text-slate-800"
                >
                  <option value="fast2sms">Fast2SMS (Recommended for India - Instant Setup)</option>
                  <option value="twilio">Twilio (International / Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 flex items-center justify-between">
                  <span>Fast2SMS API Key</span>
                  <a
                    href="https://www.fast2sms.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline font-bold text-[10px] flex items-center gap-1"
                  >
                    Get Free API Key at Fast2SMS.com ↗
                  </a>
                </label>
                <input
                  type="password"
                  disabled={!canEdit}
                  value={settings.fast2smsApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, fast2smsApiKey: e.target.value })}
                  placeholder="Paste your Fast2SMS API Authorization Key here"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none font-mono"
                />
              </div>
            </div>

            {settings.smsProvider === 'twilio' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 mb-1 text-[11px]">Twilio Account SID</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.twilioAccountSid || ''}
                    onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                    placeholder="ACXXXXXXXXXXXXXXXX"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 text-[11px]">Twilio Auth Token</label>
                  <input
                    type="password"
                    disabled={!canEdit}
                    value={settings.twilioAuthToken || ''}
                    onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })}
                    placeholder="Auth Token"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 text-[11px]">Twilio Phone Number</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.twilioPhoneNumber || ''}
                    onChange={(e) => setSettings({ ...settings, twilioPhoneNumber: e.target.value })}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Test SMS dispatch box */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <h4 className="text-xs font-bold text-sky-950">Test Gateway Dispatch</h4>
                <p className="text-[11px] text-sky-800">Send a live test verification SMS to ensure your API credentials work.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="tel"
                  id="testPhoneInput"
                  placeholder="10-digit mobile number"
                  defaultValue={user?.mobileNumber || user?.phone || ''}
                  className="px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-bold w-full sm:w-48 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const phoneEl = document.getElementById('testPhoneInput');
                    const phoneVal = phoneEl ? phoneEl.value.trim() : '';
                    if (!phoneVal) return toast.error('Enter a mobile number to test.');
                    const toastId = toast.loading('Sending test SMS...', { id: 'sms-test' });
                    try {
                      const res = await axios.post('/api/settings/test-sms', { phone: phoneVal });
                      if (res.data && res.data.success) {
                        toast.success(res.data.message || '✅ Test SMS sent successfully!', { id: 'sms-test' });
                      } else {
                        toast.error(res.data?.message || 'Failed to send test SMS.', { id: 'sms-test' });
                      }
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to dispatch test SMS. Check your API key.', { id: 'sms-test' });
                    }
                  }}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap transition cursor-pointer"
                >
                  Send Test SMS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription & Treasury Rules Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Monthly Subscription Rate Setup
          </h2>

          <div className="max-w-md text-xs font-semibold">
            <label className="block text-slate-600 mb-1">Default Monthly Member Contribution (₹)</label>
            <input
              type="number"
              disabled={!canEdit}
              value={settings.subscriptionAmount}
              onChange={(e) => setSettings({ ...settings, subscriptionAmount: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 font-medium mt-1">This standard monthly fee applies to all youth members unless customized.</p>
          </div>
        </div>


        {/* System & Data Maintenance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" /> Database Maintenance & Reset
          </h2>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-rose-950">Delete All Stored Test Data</h4>
              <p className="text-[11px] font-medium text-rose-700">Wipe all previous stored subscriptions, financial income/expenses, events, and attendance records.</p>
            </div>
            <button
              type="button"
              onClick={handleResetAllData}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 whitespace-nowrap"
            >
              Delete Stored Data
            </button>
          </div>
        </div>
      </form>

      {/* Logo Lightbox Modal */}
      {showLogoModal && (logoPreview || settings.churchLogo) && (
        <PhotoLightboxModal
          photoUrl={logoPreview || settings.churchLogo}
          title={`${settings.churchName || 'Parish'} Crest Logo`}
          subtitle={settings.youthName || 'Youth Association'}
          allowDownload={true}
          onClose={() => setShowLogoModal(false)}
        />
      )}
    </div>
  );
}
