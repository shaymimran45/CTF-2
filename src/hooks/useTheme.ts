import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'horror';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) return savedTheme;
    return 'horror';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'horror');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'horror' ? 'dark' : 'horror');
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };
}