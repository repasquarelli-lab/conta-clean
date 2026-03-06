import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppState, loadState, saveState, makeDemoData, ensureMonthFixedBills, todayISO } from '@/lib/store';

type Screen = 'landing' | 'auth' | 'app';
type View = 'dashboard' | 'lancamentos' | 'fixas' | 'agenda' | 'resumo' | 'config';

interface AppContextType {
  state: AppState;
  setState: (s: AppState) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
  currentView: View;
  setCurrentView: (v: View) => void;
  currentMonth: string;
  setCurrentMonth: (m: string) => void;
  updateState: (updater: (prev: AppState) => AppState) => void;
  reloadDemo: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(() => {
    const s = loadState();
    return ensureMonthFixedBills(s, todayISO().slice(0, 7));
  });
  const [screen, setScreen] = useState<Screen>('landing');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(todayISO().slice(0, 7));

  const setState = useCallback((s: AppState) => {
    setStateRaw(s);
    saveState(s);
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateRaw(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const reloadDemo = useCallback(() => {
    const demo = makeDemoData();
    setState(demo);
    setCurrentMonth(todayISO().slice(0, 7));
  }, [setState]);

  return (
    <AppContext.Provider value={{ state, setState, screen, setScreen, currentView, setCurrentView, currentMonth, setCurrentMonth, updateState, reloadDemo }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export type { Screen, View };
