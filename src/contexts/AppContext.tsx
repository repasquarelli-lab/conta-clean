import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState, loadState, saveState, makeDemoData, ensureMonthFixedBills, todayISO } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

type Screen = 'landing' | 'auth' | 'app';
type View = 'dashboard' | 'lancamentos' | 'fixas' | 'agenda' | 'resumo' | 'config' | 'admin';

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
  onAuthSuccess: ReturnType<typeof useAuth>;
  isAuthenticated: boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { loadFromCloud, saveToCloud } = useCloudSync(auth.user?.id);
  const [state, setStateRaw] = useState<AppState>(() => {
    const s = loadState();
    return ensureMonthFixedBills(s, todayISO().slice(0, 7));
  });
  const [screen, setScreen] = useState<Screen>('landing');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(todayISO().slice(0, 7));
  const cloudLoadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When auth state changes, load data from cloud or go to landing
  useEffect(() => {
    if (auth.loading) return;
    if (auth.user) {
      if (!cloudLoadedRef.current) {
        cloudLoadedRef.current = true;
        loadFromCloud().then(cloudState => {
          if (cloudState) {
            const s = ensureMonthFixedBills(cloudState, todayISO().slice(0, 7));
            setStateRaw(s);
            saveState(s);
          }
          setScreen('app');
        });
      } else {
        setScreen('app');
      }
    } else {
      cloudLoadedRef.current = false;
    }
  }, [auth.user, auth.loading, loadFromCloud]);

  const setState = useCallback((s: AppState) => {
    setStateRaw(s);
    saveState(s);
    // Debounce cloud save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (auth.user) {
      saveTimerRef.current = setTimeout(() => saveToCloud(s), 1500);
    }
  }, [auth.user, saveToCloud]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateRaw(prev => {
      const next = updater(prev);
      saveState(next);
      if (auth.user) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => saveToCloud(next), 1500);
      }
      return next;
    });
  }, [auth.user, saveToCloud]);

  const reloadDemo = useCallback(() => {
    const demo = makeDemoData();
    setState(demo);
    setCurrentMonth(todayISO().slice(0, 7));
  }, [setState]);

  const logout = useCallback(async () => {
    await auth.signOut();
    cloudLoadedRef.current = false;
    setScreen('landing');
    setCurrentView('dashboard');
  }, [auth]);

  // Push notifications for due/overdue bills
  useNotifications(state, !!auth.user);

  return (
    <AppContext.Provider value={{
      state, setState, screen, setScreen,
      currentView, setCurrentView, currentMonth, setCurrentMonth,
      updateState, reloadDemo,
      onAuthSuccess: auth,
      isAuthenticated: !!auth.user,
      logout,
    }}>
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
