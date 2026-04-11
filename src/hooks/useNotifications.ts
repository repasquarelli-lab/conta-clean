import { useEffect, useCallback, useRef } from 'react';
import { AppState, dueTodayBills, overdueBills, dueSoonBills, defaultNotificationSettings } from '@/lib/store';

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
      });
    } catch {
      // Fallback for environments that don't support Notification constructor
    }
  }, []);

  const checkAndNotify = useCallback((appState: AppState) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const settings = appState.notificationSettings || defaultNotificationSettings;
    if (!settings.enabled) return;

    const today = new Date().toISOString().slice(0, 10);
    const lastCheck = localStorage.getItem(NOTIFICATION_KEY);
    if (lastCheck === today) return;

    if (settings.dueTodayAlert) {
      const dueToday = dueTodayBills(appState);
      const fixedDueToday = dueToday.filter(e => e.sourceFixed);
      const otherDueToday = dueToday.filter(e => !e.sourceFixed);

      if (fixedDueToday.length > 0) {
        const total = fixedDueToday.reduce((s, e) => s + e.value, 0);
        const names = fixedDueToday.map(e => e.desc).join(', ');
        sendNotification(
          '📌 Contas fixas vencem hoje!',
          `${fixedDueToday.length} conta${fixedDueToday.length > 1 ? 's' : ''} fixa${fixedDueToday.length > 1 ? 's' : ''}: ${names} (R$ ${total.toFixed(2).replace('.', ',')})`,
          'fixed-due-today'
        );
      }

      if (otherDueToday.length > 0) {
        const total = otherDueToday.reduce((s, e) => s + e.value, 0);
        sendNotification(
          '📅 Contas vencem hoje!',
          `${otherDueToday.length} conta${otherDueToday.length > 1 ? 's' : ''} vencendo hoje, totalizando R$ ${total.toFixed(2).replace('.', ',')}`,
          'due-today'
        );
      }
    }

    if (settings.overdueAlert) {
      const overdue = overdueBills(appState);
      const fixedOverdue = overdue.filter(e => e.sourceFixed);
      const otherOverdue = overdue.filter(e => !e.sourceFixed);

      if (fixedOverdue.length > 0) {
        const total = fixedOverdue.reduce((s, e) => s + e.value, 0);
        const names = fixedOverdue.map(e => e.desc).join(', ');
        sendNotification(
          '🚨 Contas fixas atrasadas!',
          `${fixedOverdue.length} conta${fixedOverdue.length > 1 ? 's' : ''} fixa${fixedOverdue.length > 1 ? 's' : ''} atrasada${fixedOverdue.length > 1 ? 's' : ''}: ${names} (R$ ${total.toFixed(2).replace('.', ',')})`,
          'fixed-overdue'
        );
      }

      if (otherOverdue.length > 0) {
        const total = otherOverdue.reduce((s, e) => s + e.value, 0);
        sendNotification(
          '⚠️ Contas atrasadas!',
          `${otherOverdue.length} conta${otherOverdue.length > 1 ? 's' : ''} atrasada${otherOverdue.length > 1 ? 's' : ''}: R$ ${total.toFixed(2).replace('.', ',')}`,
          'overdue'
        );
      }
    }

    if (settings.dueSoonAlert) {
      const dueSoon = dueSoonBills(appState, 3);
      if (dueSoon.length > 0) {
        const total = dueSoon.reduce((s, e) => s + e.value, 0);
        sendNotification(
          '🔔 Contas nos próximos 3 dias',
          `${dueSoon.length} conta${dueSoon.length > 1 ? 's' : ''} vencendo em breve, totalizando R$ ${total.toFixed(2).replace('.', ',')}`,
          'due-soon'
        );
      }
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
