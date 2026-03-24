import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface ReferralStats {
  total: number;
  converted: number;
  rewarded: number;
}

export function useReferral(user: User | null) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({ total: 0, converted: 0, rewarded: 0 });

  const getOrCreateCode = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('referral', {
        body: { action: 'get-or-create-code' },
      });
      if (error) throw error;
      setReferralCode(data.code);
    } catch (err) {
      console.error('Error getting referral code:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const trackReferral = useCallback(async (code: string) => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.functions.invoke('referral', {
        body: { action: 'track-referral', referral_code: code },
      });
      if (error) throw error;
      return data.tracked;
    } catch (err) {
      console.error('Error tracking referral:', err);
      return false;
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('referral', {
        body: { action: 'get-stats' },
      });
      if (error) throw error;
      setStats({ total: data.total || 0, converted: data.converted || 0, rewarded: data.rewarded || 0 });
    } catch (err) {
      console.error('Error fetching referral stats:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getOrCreateCode();
      fetchStats();
    }
  }, [user, getOrCreateCode, fetchStats]);

  // Check URL for referral code on mount
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      trackReferral(ref).then((tracked) => {
        if (tracked) {
          // Clean the URL
          const url = new URL(window.location.href);
          url.searchParams.delete('ref');
          window.history.replaceState({}, '', url.toString());
        }
      });
    }
  }, [user, trackReferral]);

  return { referralCode, loading, stats, refreshStats: fetchStats };
}
