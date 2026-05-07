import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppState, FixedBill, Entry, BudgetGoal, NotificationSettings, CreditCard } from '@/lib/store';
import { defaultNotificationSettings } from '@/lib/store';

export function useCloudSync(userId: string | undefined) {
  const loadFromCloud = useCallback(async (): Promise<AppState | null> => {
    if (!userId) return null;

    const [profileRes, fixedRes, entriesRes, goalsRes, cardsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('fixed_bills').select('*').eq('user_id', userId),
      supabase.from('entries').select('*').eq('user_id', userId),
      supabase.from('budget_goals').select('*').eq('user_id', userId),
      supabase.from('credit_cards').select('*').eq('user_id', userId),
    ]);

    if (profileRes.error) return null;

    const profile: any = profileRes.data;
    const fixedBills: FixedBill[] = (fixedRes.data || []).map((f: any) => ({
      id: f.id, name: f.name, value: Number(f.value), day: f.day, category: f.category,
    }));

    const entries: Entry[] = (entriesRes.data || []).map((e: any) => ({
      id: e.id,
      type: e.type as 'income' | 'expense',
      desc: e.description,
      value: Number(e.value),
      date: e.date,
      category: e.category,
      paid: e.paid,
      recurring: e.recurring,
      sourceFixed: e.source_fixed,
      cardId: e.card_id || undefined,
    }));

    const budgetGoals: BudgetGoal[] = (goalsRes.data || []).map((g: any) => ({
      category: g.category, limit: Number(g.limit),
    }));

    const creditCards: CreditCard[] = (cardsRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      brand: c.brand || '',
      last4: c.last4 || '',
      creditLimit: Number(c.credit_limit || 0),
      closingDay: c.closing_day,
      dueDay: c.due_day,
      color: c.color || '#7c3aed',
    }));

    const customCategories: string[] = Array.isArray(profile.custom_categories) ? profile.custom_categories as string[] : [];
    const customIncomeCategories: string[] = Array.isArray(profile.custom_income_categories) ? profile.custom_income_categories as string[] : [];
    const notificationSettings: NotificationSettings = profile.notification_settings
      ? (profile.notification_settings as unknown as NotificationSettings)
      : defaultNotificationSettings;

    return {
      brandName: profile.brand_name || 'Conta Clara Lite',
      userName: profile.user_name || '',
      fixedBills,
      entries,
      budgetGoals,
      customCategories,
      customIncomeCategories,
      notificationSettings,
      creditCards,
      onboardingCompleted: !!profile.onboarding_completed,
    };
  }, [userId]);

  const saveToCloud = useCallback(async (state: AppState) => {
    if (!userId) return;

    try {
      await supabase.from('profiles').update({
        user_name: state.userName,
        brand_name: state.brandName,
        custom_categories: JSON.parse(JSON.stringify(state.customCategories || [])),
        custom_income_categories: JSON.parse(JSON.stringify(state.customIncomeCategories || [])),
        notification_settings: JSON.parse(JSON.stringify(state.notificationSettings || defaultNotificationSettings)),
        onboarding_completed: !!state.onboardingCompleted,
        updated_at: new Date().toISOString(),
      } as any).eq('id', userId);

      await supabase.from('fixed_bills').delete().eq('user_id', userId);
      if (state.fixedBills.length > 0) {
        await supabase.from('fixed_bills').insert(
          state.fixedBills.map(f => ({
            id: f.id, user_id: userId, name: f.name, value: f.value, day: f.day, category: f.category,
          }))
        );
      }

      await supabase.from('credit_cards').delete().eq('user_id', userId);
      if ((state.creditCards || []).length > 0) {
        await supabase.from('credit_cards').insert(
          (state.creditCards || []).map(c => ({
            id: c.id,
            user_id: userId,
            name: c.name,
            brand: c.brand || '',
            last4: c.last4 || '',
            credit_limit: c.creditLimit,
            closing_day: c.closingDay,
            due_day: c.dueDay,
            color: c.color || '#7c3aed',
          }))
        );
      }

      await supabase.from('entries').delete().eq('user_id', userId);
      if (state.entries.length > 0) {
        await supabase.from('entries').insert(
          state.entries.map(e => ({
            id: e.id,
            user_id: userId,
            type: e.type,
            description: e.desc,
            value: e.value,
            date: e.date,
            category: e.category,
            paid: e.paid,
            recurring: e.recurring,
            source_fixed: e.sourceFixed || false,
            card_id: e.cardId || null,
          }))
        );
      }

      await supabase.from('budget_goals').delete().eq('user_id', userId);
      if ((state.budgetGoals || []).length > 0) {
        await supabase.from('budget_goals').insert(
          (state.budgetGoals || []).map(g => ({
            user_id: userId, category: g.category, limit: g.limit,
          }))
        );
      }
    } catch (err) {
      console.error('Erro ao sincronizar com a nuvem:', err);
    }
  }, [userId]);

  return { loadFromCloud, saveToCloud };
}
