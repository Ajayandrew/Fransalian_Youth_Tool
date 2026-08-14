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
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data && res.data.settings) {
        setSettings({ ...defaultSettings, ...res.data.settings });
      }
    } catch (err) {
      console.warn('Using default settings');
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
        res = await axios.post('/api/settings', formDataOrObject);
      } else {
        res = await axios.post('/api/settings', formDataOrObject);
      }

      if (res.data && res.data.settings) {
        setSettings({ ...defaultSettings, ...res.data.settings });
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
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
