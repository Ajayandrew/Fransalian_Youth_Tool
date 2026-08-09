import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const darkMode = false;
  const setDarkMode = () => {};
  const toggleDarkMode = () => {};

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('fy_theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
