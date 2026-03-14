import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppState, FixedBill, Entry, BudgetGoal, NotificationSettings } from '@/lib/store';
import { defaultNotificationSettings } from '@/lib/store';

export function useCloudSync(userId: string | undefined) {
  const loadFromCloud = useCallback(async (): Promise<AppState | null> => {
    if (!userId) return null;

    const [profileRes, fixedRes, entriesRes, goalsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('fixed_bills').select('*').eq('user_id', userId),
      supabase.from('entries').select('*').eq('user_id', userId),
      supabase.from('budget_goals').select('*').eq('user_id', userId),
    ]);

    if (profileRes.error) return null;

    const profile = profileRes.data;
    const fixedBills: FixedBill[] = (fixedRes.data || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      value: Number(f.value),
      day: f.day,
      category: f.category,
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
    }));

    const budgetGoals: BudgetGoal[] = (goalsRes.data || []).map((g: any) => ({
      category: g.category,
      limit: Number(g.limit),
    }));

    // Parse custom categories and notification settings from profile
    const customCategories: string[] = Array.isArray(profile.custom_categories) 
      ? profile.custom_categories as string[] 
      : [];
    const customIncomeCategories: string[] = Array.isArray(profile.custom_income_categories) 
      ? profile.custom_income_categories as string[]
      : [];
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
    };
  }, [userId]);

  const saveToCloud = useCallback(async (state: AppState) => {
    if (!userId) return;

    try {
      // Update profile (including custom categories and notification settings)
      await supabase.from('profiles').update({
        user_name: state.userName,
        brand_name: state.brandName,
        custom_categories: JSON.parse(JSON.stringify(state.customCategories || [])),
        custom_income_categories: JSON.parse(JSON.stringify(state.customIncomeCategories || [])),
        notification_settings: JSON.parse(JSON.stringify(state.notificationSettings || defaultNotificationSettings)),
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      // Sync fixed bills: delete all and re-insert
      await supabase.from('fixed_bills').delete().eq('user_id', userId);
      if (state.fixedBills.length > 0) {
        await supabase.from('fixed_bills').insert(
          state.fixedBills.map(f => ({
            id: f.id,
            user_id: userId,
            name: f.name,
            value: f.value,
            day: f.day,
            category: f.category,
          }))
        );
      }

      // Sync entries: delete all and re-insert
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
          }))
        );
      }

      // Sync budget goals: delete all and re-insert
      await supabase.from('budget_goals').delete().eq('user_id', userId);
      if ((state.budgetGoals || []).length > 0) {
        await supabase.from('budget_goals').insert(
          (state.budgetGoals || []).map(g => ({
            user_id: userId,
            category: g.category,
            limit: g.limit,
          }))
        );
      }
    } catch (err) {
      console.error('Erro ao sincronizar com a nuvem:', err);
    }
  }, [userId]);

  return { loadFromCloud, saveToCloud };
}
