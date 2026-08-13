import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  CreditCard,
  Wallet,
  CalendarCheck,
  Calendar,
  Cake,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Plus,
  Share2,
  Youtube,
  Facebook,
  Instagram,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Award,
  Phone,
  UserCheck,
  ZoomIn
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useDataCache } from '../context/DataContext';
import { getImageUrl } from '../utils/urlUtils';
import PhotoLightboxModal from '../components/PhotoLightboxModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { fetchWithCache } = useDataCache();
  const isYouthMember = !user?.role || user?.role === 'Youth Member';
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    monthlySubscriptionCollection: 0,
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 0,
    todayBirthdaysCount: 0,
    upcomingEventsCount: 0
  });

  const [charts, setCharts] = useState({
    financialOverview: [
      { name: 'Income', amount: 0 },
      { name: 'Expenses', amount: 0 },
      { name: 'Balance', amount: 0 }
    ],
    monthlyCollectionChart: [],
    attendanceOverview: []
  });

  const [recentActivity, setRecentActivity] = useState({
    newMembers: [],
    recentPayments: [],
    upcomingBirthdays: [],
    upcomingEvents: []
  });

  const [leadership, setLeadership] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await fetchWithCache('dashboard', '/api/dashboard/stats');
        if (data && data.success) {
          setStats(data.stats || stats);
          setCharts(data.charts || charts);
          setRecentActivity(data.recentActivity || recentActivity);
          if (data.leadership) setLeadership(data.leadership);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const ensureAbsoluteUrl = (url, fallback) => {
    if (!url || !url.trim()) return fallback;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    return `https://${cleanUrl}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-amber-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{settings.youthName || 'Youth Movement'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Welcome, {user?.fullName || 'Parish Member'}!</h1>
          <p className="text-xs text-indigo-200 mt-1 font-medium">{settings.churchName || 'Cathedral Parish'} • Dues, Accounts, Attendance & Events</p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-indigo-950 font-black text-xs uppercase tracking-wider shadow-md">
            Role: {user?.role || 'Youth Member'}
          </span>
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition"
          >
            Switch Role →
          </Link>
          {!isYouthMember && (
            <button
              onClick={() => logout()}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Logout Safely"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Youth Members */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Members</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalMembers}</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{stats.activeMembers} Active Registered</p>
          </div>
        </div>

        {/* Paid Subscriptions & Secret Offering Total */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Combined Collections</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-600">₹{(stats.combinedCollections || ((stats.totalSubsPaid || 0) + (stats.totalSecretOff || 0))).toLocaleString()}</h3>
            <p className="text-[11px] text-slate-600 font-extrabold mt-0.5">
              Paid Subs + Secret Offering
            </p>
          </div>
        </div>

        {/* Net Treasury Balance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Net Treasury Balance</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">₹{(stats.currentBalance || 0).toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Total Income - Expenses</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Upcoming Events</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{stats.upcomingEventsCount}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{stats.todayBirthdaysCount} Birthdays Today</p>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Financial Ledger Overview</h3>
              <p className="text-xs text-slate-500 font-medium">Income, Expenses & Running Balance</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.financialOverview}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="amount" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Subscription Collection Trend */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Monthly Subscription Trend (₹50/Mo)</h3>
              <p className="text-xs text-slate-500 font-medium">Collection trajectory across recent months</p>
            </div>
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyCollectionChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Recently Registered Members</span>
            </h3>
            <Link to="/members" className="text-xs text-indigo-600 font-bold hover:underline">View All →</Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {(recentActivity.newMembers || []).map((m) => (
              <div key={m._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100'}
                    alt={m.fullName}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100';
                    }}
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900">{m.fullName}</h4>
                    <p className="text-slate-500">{m.anbiyamName}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {m.activeStatus}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Upcoming Youth Events</span>
            </h3>
            <Link to="/events" className="text-xs text-indigo-600 font-bold hover:underline">View All →</Link>
          </div>

          <div className="space-y-3">
            {(recentActivity.upcomingEvents || []).map((evt) => (
              <div key={evt._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{evt.eventName}</h4>
                  <p className="text-indigo-600 font-medium mt-0.5">{evt.date} • {evt.time} ({evt.venue})</p>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {evt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Leadership Team & Office Bearers (Highlighted before Social Media) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Parish & Youth Leadership Team</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Key spiritual & youth office bearers serving our community</p>
          </div>
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto shadow-2xs">
            Office Bearers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(leadership.length > 0 ? leadership : [
            { roleKey: 'priest', roleTitle: 'Parish Priest', subTitle: settings.parishPriestTitle || 'Parish Priest / Spiritual Director', fullName: settings.parishPriestName || 'Rev. Fr. Parish Priest', photo: settings.parishPriestPhoto, mobileNumber: settings.parishPriestPhone || settings.contactPhone },
            { roleKey: 'leader', roleTitle: 'Youth Leader', subTitle: 'President / Youth Leader', fullName: 'Youth Leader', photo: '' },
            { roleKey: 'secretary', roleTitle: 'Secretary', subTitle: 'Youth Secretary', fullName: 'Secretary', photo: '' },
            { roleKey: 'treasurer', roleTitle: 'Treasurer', subTitle: 'Youth Treasurer', fullName: 'Treasurer', photo: '' }
          ]).map((leader, idx) => {
            const roleStyles = {
              priest: {
                bg: 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white',
                border: 'border-amber-300/80 hover:border-amber-400',
                badge: 'bg-amber-100 text-amber-900 border-amber-300',
                ring: 'ring-4 ring-amber-400/30',
                iconColor: 'text-amber-600',
                avatarBg: 'bg-amber-100 text-amber-800'
              },
              leader: {
                bg: 'bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-white',
                border: 'border-indigo-200/90 hover:border-indigo-400',
                badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                ring: 'ring-4 ring-indigo-400/30',
                iconColor: 'text-indigo-600',
                avatarBg: 'bg-indigo-100 text-indigo-800'
              },
              secretary: {
                bg: 'bg-gradient-to-b from-sky-500/10 via-sky-500/5 to-white',
                border: 'border-sky-200/90 hover:border-sky-400',
                badge: 'bg-sky-100 text-sky-900 border-sky-300',
                ring: 'ring-4 ring-sky-400/30',
                iconColor: 'text-sky-600',
                avatarBg: 'bg-sky-100 text-sky-800'
              },
              treasurer: {
                bg: 'bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-white',
                border: 'border-emerald-200/90 hover:border-emerald-400',
                badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                ring: 'ring-4 ring-emerald-400/30',
                iconColor: 'text-emerald-600',
                avatarBg: 'bg-emerald-100 text-emerald-800'
              }
            };

            const style = roleStyles[leader.roleKey] || roleStyles.leader;
            const photoUrl = leader.photo ? getImageUrl(leader.photo) : '';

            return (
              <div
                key={leader.id || idx}
                className={`p-5 rounded-2xl border ${style.border} ${style.bg} transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center relative group space-y-3.5`}
              >
                {/* Role Badge */}
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badge} shadow-2xs`}>
                  {leader.roleTitle}
                </span>

                {/* Highlighted Avatar Photo */}
                <div
                  onClick={() => {
                    if (photoUrl) {
                      setLightboxPhoto({
                        url: photoUrl,
                        title: leader.fullName,
                        subtitle: `${leader.roleTitle} • ${settings.youthName || 'Fransalian Youth'}`
                      });
                    }
                  }}
                  className={`w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full ${style.ring} overflow-hidden shadow-lg flex items-center justify-center ${style.avatarBg} relative transition-all duration-300 group-hover:scale-105 ${photoUrl ? 'cursor-pointer' : ''}`}
                  title={photoUrl ? 'Click to enlarge photo' : leader.fullName}
                >
                  {photoUrl ? (
                    <>
                      <img
                        src={photoUrl}
                        alt={leader.fullName}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
                        }}
                        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white drop-shadow-md" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <UserCheck className={`w-14 h-14 ${style.iconColor}`} />
                    </div>
                  )}
                </div>

                {/* Name & Details */}
                <div className="w-full space-y-1">
                  <h4 className="text-sm font-black text-slate-900 tracking-tight truncate px-1" title={leader.fullName}>
                    {leader.fullName}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-500 truncate">{leader.subTitle}</p>
                </div>

                {/* Contact or Anbiyam Footer */}
                {(leader.mobileNumber || leader.anbiyamName) && (
                  <div className="pt-2 border-t border-slate-200/60 w-full text-[11px] font-medium text-slate-600 flex items-center justify-center gap-1.5 truncate">
                    {leader.mobileNumber ? (
                      <span className="flex items-center gap-1 text-slate-700 font-bold">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {leader.mobileNumber}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">{leader.anbiyamName}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Social Media Channels Banner (Placed at the bottom) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <span>Connect With Us - Official Church & Youth Channels</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Follow and subscribe to stay updated with youth mass, events & feast live streams</p>
          </div>
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
            Social Handles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* YouTube */}
          <a
            href={ensureAbsoluteUrl(settings.youtubeUrl, 'https://youtube.com')}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-900 transition flex items-center justify-between group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs">YouTube Channel</h4>
                <p className="text-[10px] text-rose-700 font-medium truncate max-w-[140px]">
                  {settings.youtubeUrl ? settings.youtubeUrl.replace(/^https?:\/\//, '') : 'Watch Youth Videos'}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </a>

          {/* Facebook */}
          <a
            href={ensureAbsoluteUrl(settings.facebookUrl, 'https://facebook.com')}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-900 transition flex items-center justify-between group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                <Facebook className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs">Facebook Page</h4>
                <p className="text-[10px] text-blue-700 font-medium truncate max-w-[140px]">
                  {settings.facebookUrl ? settings.facebookUrl.replace(/^https?:\/\//, '') : 'Parish Youth Updates'}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </a>

          {/* Instagram */}
          <a
            href={ensureAbsoluteUrl(settings.instagramUrl, 'https://instagram.com')}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-pink-50 hover:bg-pink-100/80 border border-pink-200 text-pink-900 transition flex items-center justify-between group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs">Instagram Feed</h4>
                <p className="text-[10px] text-pink-700 font-medium truncate max-w-[140px]">
                  {settings.instagramUrl ? settings.instagramUrl.replace(/^https?:\/\//, '') : 'Photos & Stories'}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-pink-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Lightbox Photo Modal */}
      {lightboxPhoto && (
        <PhotoLightboxModal
          photoUrl={lightboxPhoto.url}
          title={lightboxPhoto.title}
          subtitle={lightboxPhoto.subtitle}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  );
}
