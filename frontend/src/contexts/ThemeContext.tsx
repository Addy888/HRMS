'use client';

import React, { createContext, useContext, useEffect } from 'react';

// Light Mode Only - No theme switching
interface ThemeContextType {
  theme: 'light';
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Ensure dark class is never applied
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('hrms-theme');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
