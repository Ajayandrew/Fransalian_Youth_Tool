import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';

// Lazy-loaded pages for blazingly fast bundle splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Members = lazy(() => import('./pages/Members'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Finance = lazy(() => import('./pages/Finance'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Events = lazy(() => import('./pages/Events'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Birthdays = lazy(() => import('./pages/Birthdays'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-28 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
      </div>
      <div className="h-64 bg-white rounded-3xl border border-slate-200" />
    </div>
  );
}

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
        }`}
      >
        <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 pb-12">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/events" element={<Events />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/birthdays" element={<Birthdays />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Suspense>
  );
}
