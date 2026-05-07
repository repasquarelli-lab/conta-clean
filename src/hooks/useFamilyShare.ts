import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFamilyShare() {
  const invoke = useCallback(async (action: string, payload: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('family-share', {
      body: { action, ...payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  return {
    invite: (email: string) => invoke('invite', { email }),
    listMine: () => invoke('list-mine'),
    listSharedWithMe: () => invoke('list-shared-with-me'),
    accept: (token: string) => invoke('accept', { token }),
    revoke: (id: string) => invoke('revoke', { id }),
  };
}
