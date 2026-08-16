import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

const defaultSettings = {
  churchName: 'St. Mary Cathedral Parish',
  youthName: 'Francisalian Youth Movement',
  address: '12 Cathedral Road',
  city: 'Chennai',
  district: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600004',
  contactEmail: 'youth@church.org',
  contactPhone: '+91 98765 43210',
  churchLogo: '',
  patronPhoto: '',
  subscriptionAmount: 50,
  darkMode: false
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fy_settings_v1');
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultSettings;
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data && res.data.settings) {
        const merged = { ...defaultSettings, ...res.data.settings };
        setSettings(merged);
        try {
          localStorage.setItem('fy_settings_v1', JSON.stringify(merged));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Using cached or default settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (formDataOrObject) => {
    try {
      let res;
      if (formDataOrObject instanceof FormData) {
        res = await axios.post('/api/settings', formDataOrObject, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post('/api/settings', formDataOrObject);
      }

      if (res.data && res.data.settings) {
        setSettings(prev => ({ ...defaultSettings, ...prev, ...res.data.settings }));
      }
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    return { settings: defaultSettings, loading: false, refreshSettings: () => {}, updateSettings: async () => {} };
  }
  return { ...context, settings: context.settings || defaultSettings };
};
