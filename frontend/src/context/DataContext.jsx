import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const DataContext = createContext();

export function DataProvider({ children }) {
  const cacheRef = React.useRef({});
  const cacheTimeRef = React.useRef({});
  const inFlightRef = React.useRef({});
  const [loadingKeys, setLoadingKeys] = useState({});

  const CACHE_TTL_MS = 15000; // 15 seconds fresh cache TTL

  const fetchWithCache = useCallback(async (key, url, params = {}, forceRefresh = false) => {
    const cacheKey = key + JSON.stringify(params);
    const now = Date.now();
    const cachedData = cacheRef.current[cacheKey];
    const cachedTime = cacheTimeRef.current[cacheKey] || 0;

    // 1. Fresh cache hit: Return immediately without any network request
    if (cachedData && !forceRefresh && (now - cachedTime < CACHE_TTL_MS)) {
      return cachedData;
    }

    // 2. Stale cache hit: Return cached data immediately, then trigger silent background revalidation
    if (cachedData && !forceRefresh) {
      if (!inFlightRef.current[cacheKey]) {
        inFlightRef.current[cacheKey] = axios.get(url, { params })
          .then(res => {
            if (res.data) {
              cacheRef.current[cacheKey] = res.data;
              cacheTimeRef.current[cacheKey] = Date.now();
            }
            return res.data;
          })
          .catch(() => {})
          .finally(() => {
            delete inFlightRef.current[cacheKey];
          });
      }
      return cachedData;
    }

    // 3. In-flight request deduplication: If request is already pending, reuse the existing promise
    if (inFlightRef.current[cacheKey] && !forceRefresh) {
      return inFlightRef.current[cacheKey];
    }

    // 4. Cache miss or forceRefresh: Fetch from backend
    setLoadingKeys(prev => ({ ...prev, [cacheKey]: true }));
    const fetchPromise = axios.get(url, { params })
      .then(res => {
        if (res.data) {
          cacheRef.current[cacheKey] = res.data;
          cacheTimeRef.current[cacheKey] = Date.now();
        }
        return res.data;
      })
      .finally(() => {
        setLoadingKeys(prev => ({ ...prev, [cacheKey]: false }));
        delete inFlightRef.current[cacheKey];
      });

    inFlightRef.current[cacheKey] = fetchPromise;
    return fetchPromise;
  }, []);

  const invalidateCache = useCallback((keyPrefix) => {
    Object.keys(cacheRef.current).forEach(k => {
      if (!keyPrefix || k.startsWith(keyPrefix)) {
        delete cacheRef.current[k];
        delete cacheTimeRef.current[k];
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
