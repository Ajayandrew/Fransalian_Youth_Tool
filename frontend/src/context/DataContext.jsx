import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [cache, setCache] = useState({});
  const [loadingKeys, setLoadingKeys] = useState({});

  const fetchWithCache = useCallback(async (key, url, params = {}, forceRefresh = false) => {
    // If cached data exists and not forcing refresh, return cached data immediately
    const cacheKey = key + JSON.stringify(params);

    if (cache[cacheKey] && !forceRefresh) {
      // Background silent revalidation
      axios.get(url, { params })
        .then(res => {
          if (res.data) {
            setCache(prev => ({ ...prev, [cacheKey]: res.data }));
          }
        })
        .catch(() => {});

      return cache[cacheKey];
    }

    setLoadingKeys(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const res = await axios.get(url, { params });
      if (res.data) {
        setCache(prev => ({ ...prev, [cacheKey]: res.data }));
      }
      return res.data;
    } catch (err) {
      throw err;
    } finally {
      setLoadingKeys(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [cache]);

  const invalidateCache = useCallback((keyPrefix) => {
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(k => {
        if (!keyPrefix || k.startsWith(keyPrefix)) {
          delete newCache[k];
        }
      });
      return newCache;
    });
  }, []);

  return (
    <DataContext.Provider value={{ cache, fetchWithCache, invalidateCache, loadingKeys }}>
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
