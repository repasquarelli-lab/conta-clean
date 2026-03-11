import { useEffect, useState, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('cc-theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);
  const [resolved, setResolved] = useState<ResolvedTheme>(
    () => mode === 'system' ? getSystemTheme() : mode as ResolvedTheme
  );

  useEffect(() => {
    localStorage.setItem('cc-theme', mode);

    if (mode !== 'system') {
      setResolved(mode);
      return;
    }

    setResolved(getSystemTheme());

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setResolved(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.classList.toggle('light', resolved === 'light');
  }, [resolved]);

  const setTheme = useCallback((t: ThemeMode) => setMode(t), []);

  // backward compat
  const toggleTheme = useCallback(() => {
    setMode(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'dark' : (getSystemTheme() === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme: resolved, mode, setTheme, toggleTheme };
}
