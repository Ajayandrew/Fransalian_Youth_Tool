import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  CalendarCheck,
  Calendar,
  Image as GalleryIcon,
  Cake,
  BarChart3,
  Settings as SettingsIcon,
  ChevronRight,
  ShieldCheck,
  X,
  Droplet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import PhotoLightboxModal from './PhotoLightboxModal';
import { getImageUrl } from '../utils/urlUtils';

export default function Sidebar({ isOpen, setIsOpen, isMobileOpen, setIsMobileOpen }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [showLogoModal, setShowLogoModal] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Youth Members', icon: Users, path: '/members' },
    { label: 'Monthly Subscription', icon: CreditCard, path: '/subscriptions' },
    { label: 'Accounts & Finance', icon: Wallet, path: '/finance' },
    { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { label: 'Events', icon: Calendar, path: '/events' },
    { label: 'Gallery', icon: GalleryIcon, path: '/gallery' },
    { label: 'Birthdays', icon: Cake, path: '/birthdays' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
    ...(user?.role === 'Admin' ? [{ label: 'Settings', icon: SettingsIcon, path: '/settings' }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 bg-white border-r border-slate-200 flex flex-col shadow-sm ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isOpen ? 'md:w-64' : 'md:w-20'}`}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <div
            className="flex items-center space-x-3 overflow-hidden cursor-pointer group"
            onClick={() => settings.churchLogo && setShowLogoModal(true)}
            title={settings.churchLogo ? "Click to view and download logo" : ""}
          >
            {settings.churchLogo ? (
              <img src={getImageUrl(settings.churchLogo)} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex-shrink-0 flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-600/30">
                {(settings.youthName || 'FY').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            {(isOpen || isMobileOpen) && (
              <div className="truncate">
                <h1 className="text-xs font-black text-slate-900 leading-tight truncate">{settings.youthName || 'Francisalian Youth'}</h1>
                <p className="text-[10px] text-indigo-600 font-bold tracking-wide uppercase truncate">{settings.churchName || 'CHURCH MANAGEMENT'}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Badge */}
        {(isOpen || isMobileOpen) && user && (
          <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <div className="truncate">
              <p className="text-xs text-slate-900 font-bold leading-tight truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-500 font-semibold capitalize">{user.role}</p>
            </div>
          </div>
        )}

        {/* Menu Navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {(isOpen || isMobileOpen) && <span className="truncate flex-1">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Desktop Collapse Button */}
        <div className="hidden md:block p-3 border-t border-slate-100">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            {isOpen && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Logo Lightbox Modal */}
      {showLogoModal && settings.churchLogo && (
        <PhotoLightboxModal
          photoUrl={settings.churchLogo}
          title={`${settings.churchName || 'Parish'} Crest Logo`}
          subtitle={settings.youthName || 'Youth Movement'}
          onClose={() => setShowLogoModal(false)}
        />
      )}
    </>
  );
}
