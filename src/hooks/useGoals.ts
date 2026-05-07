import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_value: number;
  current_value: number;
  deadline: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setGoals([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar metas');
    else setGoals((data as Goal[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const upsert = useCallback(async (goal: Partial<Goal> & { name: string; target_value: number }) => {
    if (!userId) return;
    const payload: any = {
      user_id: userId,
      name: goal.name,
      target_value: goal.target_value,
      current_value: goal.current_value ?? 0,
      deadline: goal.deadline || null,
      color: goal.color || '#7c3aed',
    };
    if (goal.id) payload.id = goal.id;
    const { error } = await supabase.from('goals').upsert(payload);
    if (error) { toast.error('Erro ao salvar meta'); return; }
    toast.success('Meta salva!');
    refresh();
  }, [userId, refresh]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    refresh();
  }, [refresh]);

  const addContribution = useCallback(async (id: string, amount: number) => {
    const g = goals.find(x => x.id === id);
    if (!g) return;
    const next = Number(g.current_value || 0) + amount;
    const { error } = await supabase.from('goals').update({ current_value: next }).eq('id', id);
    if (error) { toast.error('Erro ao registrar aporte'); return; }
    toast.success('Aporte registrado!');
    refresh();
  }, [goals, refresh]);

  return { goals, loading, refresh, upsert, remove, addContribution };
}
