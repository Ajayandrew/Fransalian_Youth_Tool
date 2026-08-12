import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const DataContext = createContext();

export function DataProvider({ children }) {
  const cacheRef = React.useRef({});
  const [loadingKeys, setLoadingKeys] = useState({});

  const fetchWithCache = useCallback(async (key, url, params = {}, forceRefresh = false) => {
    const cacheKey = key + JSON.stringify(params);

    if (cacheRef.current[cacheKey] && !forceRefresh) {
      // Background silent revalidation
      axios.get(url, { params })
        .then(res => {
          if (res.data) {
            cacheRef.current[cacheKey] = res.data;
          }
        })
        .catch(() => {});

      return cacheRef.current[cacheKey];
    }

    setLoadingKeys(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const res = await axios.get(url, { params });
      if (res.data) {
        cacheRef.current[cacheKey] = res.data;
      }
      return res.data;
    } catch (err) {
      throw err;
    } finally {
      setLoadingKeys(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, []);

  const invalidateCache = useCallback((keyPrefix) => {
    Object.keys(cacheRef.current).forEach(k => {
      if (!keyPrefix || k.startsWith(keyPrefix)) {
        delete cacheRef.current[k];
      }
    });
  }, []);

  return (
    <DataContext.Provider value={{ cache: cacheRef.current, fetchWithCache, invalidateCache, loadingKeys }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataProvider');
  }
  return context;
}
