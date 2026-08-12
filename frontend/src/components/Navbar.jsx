import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Sun, Moon, User, KeyRound, Lock, Mail, X, Droplet, Search, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import RoleLoginModal from './RoleLoginModal';
import PhotoLightboxModal from './PhotoLightboxModal';
import CommandPaletteModal from './CommandPaletteModal';
import { getImageUrl } from '../utils/urlUtils';
import toast from 'react-hot-toast';

export default function Navbar({ onToggleMobileSidebar }) {
  const { user, logout, updateUserProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { settings } = useSettings();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const [accountEmail, setAccountEmail] = useState('');
  const [accountBloodGroup, setAccountBloodGroup] = useState('O+');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const isYouthMember = user?.role === 'Youth Member';

  const handleOpenAccountModal = () => {
    if (isYouthMember) {
      return toast.error('Youth members are not allowed to change credentials. Please contact a Youth Leader or Administrator.');
    }
    if (user) {
      setAccountEmail(user.email || '');
      setAccountBloodGroup(user.bloodGroup || 'O+');
      setAccountPassword('');
      setAccountConfirmPassword('');
      setShowAccountModal(true);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (isYouthMember) {
      return toast.error('Youth members are not allowed to change credentials.');
    }
    if (accountPassword && accountPassword !== accountConfirmPassword) {
      return toast.error('Passwords do not match.');
    }
    setUpdating(true);
    try {
      const res = await updateUserProfile(accountEmail, accountPassword || undefined, accountBloodGroup);
      if (res?.success) {
        setShowAccountModal(false);
      }
    } catch (err) {
      toast.error('Failed to update profile credentials.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden transition"
            title="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => settings.churchLogo && setShowLogoModal(true)}
            title={settings.churchLogo ? "Click to view and download logo" : ""}
          >
            {settings.churchLogo ? (
              <img src={getImageUrl(settings.churchLogo)} alt="Logo" className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-xs group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-sm">
                {(settings.youthName || 'FY').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">{settings.youthName || 'Francisalian Youth'}</h2>
              <p className="text-[10px] text-indigo-600 font-bold hidden sm:block">{settings.churchName || 'CHURCH YOUTH MANAGEMENT SYSTEM'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Command Palette Search Button */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 border border-slate-200"
            title="Open Quick Search & Command Palette (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Quick Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-slate-500 bg-white border border-slate-300 px-1.5 py-0.5 rounded shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Role Login / Switcher */}
          <button
            onClick={() => setShowRoleModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1.5"
            title="Switch Role Access"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Role Switcher</span>
          </button>

          {/* User Info & Credentials Change Button */}
          {user && (
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-3">
              <div
                onClick={!isYouthMember ? handleOpenAccountModal : undefined}
                className={`flex items-center space-x-2 ${!isYouthMember ? 'cursor-pointer hover:opacity-80' : ''} transition group`}
                title={!isYouthMember ? "Click to change your Email (Username) or Password" : user.fullName}
              >
                <img
                  src={getImageUrl(user.avatar || user.photo) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 group-hover:border-indigo-400"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-indigo-600">{user.fullName}</p>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">{user.role}</span>
                </div>
              </div>

              {!isYouthMember && (
                <>
                  <button
                    onClick={handleOpenAccountModal}
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition"
                    title="Change Username & Password"
                  >
                    <User className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => logout()}
                    className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center space-x-1"
                    title="Logout Safely"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <RoleLoginModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />

      {/* Credentials Management Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Username & Password</h3>
                <p className="text-xs text-slate-500 font-medium">Update login credentials for {user?.role}</p>
              </div>
              <button onClick={() => setShowAccountModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Username / Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password (Leave blank to keep current)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {accountPassword && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={accountConfirmPassword}
                      onChange={(e) => setAccountConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
                >
                  {updating ? 'Saving Profile...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logo Lightbox Modal */}
      {showLogoModal && settings.churchLogo && (
        <PhotoLightboxModal
          photoUrl={settings.churchLogo}
          title={`${settings.churchName || 'Parish'} Crest Logo`}
          subtitle={settings.youthName || 'Youth Movement'}
          onClose={() => setShowLogoModal(false)}
        />
      )}

      {/* Global Command Palette Modal */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </>
  );
}
