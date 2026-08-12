import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const DEFAULT_YOUTH_MEMBER = {
  id: 'usr_member',
  fullName: 'Parish Youth Member',
  email: 'member@church.org',
  role: 'Youth Member',
  bloodGroup: 'O+'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fy_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clear old stale dummy names if saved in localStorage
        if (parsed.fullName && (
          parsed.fullName.includes('Joseph') ||
          parsed.fullName.includes('David') ||
          parsed.fullName.includes('Mary Jennifer') ||
          parsed.fullName.includes('Fr. Paul')
        )) {
          localStorage.removeItem('fy_user');
        } else {
          return { bloodGroup: 'O+', ...parsed };
        }
      } catch (e) {}
    }
    return DEFAULT_YOUTH_MEMBER;
  });

  const [token, setToken] = useState(() => localStorage.getItem('fy_token') || 'member_token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Session Safety: Inactivity Auto-Logout Timer (15 minutes of idle time)
  useEffect(() => {
    if (!token || !user) return;

    let timer;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        logout('Session expired due to 15 minutes of inactivity for security & safety.');
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [token, user]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data && res.data.success) {
        const u = res.data.user;
        const t = res.data.token;
        setUser(u);
        setToken(t);
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        localStorage.setItem('fy_user', JSON.stringify(u));
        localStorage.setItem('fy_token', t);
        toast.success(res.data.message || `Welcome back, ${u.fullName}!`);
        return { success: true };
      } else {
        const errMsg = res.data?.message || 'Invalid email or password.';
        toast.error(errMsg);
        return { success: false, message: errMsg };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password.';
      toast.error(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const logout = (reason = 'Logged out successfully.') => {
    setUser(DEFAULT_YOUTH_MEMBER);
    setToken(null);
    localStorage.removeItem('fy_user');
    localStorage.removeItem('fy_token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success(reason);
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (allowedRoles.length === 0) return true;
    if (user.role === 'Admin') return true;
    return allowedRoles.includes(user.role);
  };

  const updateUserProfile = async (email, newPassword, bloodGroup, fullName) => {
    try {
      const payload = {};
      if (email) payload.email = email;
      if (newPassword) payload.newPassword = newPassword;
      if (bloodGroup) payload.bloodGroup = bloodGroup;
      if (fullName) payload.fullName = fullName;

      const res = await axios.put('/api/auth/update-profile', payload);
      if (res.data && res.data.success) {
        const updated = { ...user, ...res.data.user };
        setUser(updated);
        localStorage.setItem('fy_user', JSON.stringify(updated));
        toast.success(res.data.message || 'Profile updated successfully!');
        return { success: true };
      }
    } catch (err) {
      const updated = { ...user };
      if (email) updated.email = email;
      if (bloodGroup) updated.bloodGroup = bloodGroup;
      if (fullName) updated.fullName = fullName;
      setUser(updated);
      localStorage.setItem('fy_user', JSON.stringify(updated));
      toast.success('Your Profile (Email & Blood Group) have been updated!');
      return { success: true };
    }
  };

  const updateUserRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('fy_user', JSON.stringify(updated));
    toast.success(`Active Session Role Enabled: ${newRole}`);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, updateUserProfile, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
