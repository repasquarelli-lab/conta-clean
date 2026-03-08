import { useEffect, useCallback, useRef } from 'react';
import { AppState, dueTodayBills, overdueBills } from '@/lib/store';

const NOTIFICATION_KEY = 'cc_notif_last_check';

export function useNotifications(state: AppState, isAuthenticated: boolean) {
  const hasRequestedRef = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const sendNotification = useCallback((title: string, body: string, tag: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag,
        renotify: true,
      });
    } catch {
      // Fallback for environments that don't support Notification constructor
    }
  }, []);

  const checkAndNotify = useCallback((appState: AppState) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const today = new Date().toISOString().slice(0, 10);
    const lastCheck = localStorage.getItem(NOTIFICATION_KEY);
    if (lastCheck === today) return; // Already notified today

    const dueToday = dueTodayBills(appState);
    const overdue = overdueBills(appState);

    if (dueToday.length > 0) {
      const total = dueToday.reduce((s, e) => s + e.value, 0);
      sendNotification(
        '📅 Contas vencem hoje!',
        `Você tem ${dueToday.length} conta${dueToday.length > 1 ? 's' : ''} vencendo hoje, totalizando R$ ${total.toFixed(2).replace('.', ',')}`,
        'due-today'
      );
    }

    if (overdue.length > 0) {
      const total = overdue.reduce((s, e) => s + e.value, 0);
      sendNotification(
        '⚠️ Contas atrasadas!',
        `${overdue.length} conta${overdue.length > 1 ? 's' : ''} atrasada${overdue.length > 1 ? 's' : ''}: R$ ${total.toFixed(2).replace('.', ',')}`,
        'overdue'
      );
    }

    localStorage.setItem(NOTIFICATION_KEY, today);
  }, [sendNotification]);

  // Request permission once when authenticated
  useEffect(() => {
    if (!isAuthenticated || hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    requestPermission().then(granted => {
      if (granted) {
        checkAndNotify(state);
      }
    });
  }, [isAuthenticated, requestPermission, checkAndNotify, state]);

  // Re-check every 30 minutes while app is open
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      checkAndNotify(state);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, state, checkAndNotify]);

  return { requestPermission, checkAndNotify };
}
