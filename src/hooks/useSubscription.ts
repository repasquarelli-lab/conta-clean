import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface SubscriptionState {
  subscribed: boolean;
  trialActive: boolean;
  trialDaysLeft: number;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription(user: User | null) {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    trialActive: true,
    trialDaysLeft: 3,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      setState({
        subscribed: data.subscribed,
        trialActive: data.trial_active,
        trialDaysLeft: data.trial_days_left,
        subscriptionEnd: data.subscription_end,
        loading: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const openCheckout = useCallback(async (plan: 'monthly' | 'annual' = 'monthly') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error('Error creating checkout:', err);
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error('Error opening portal:', err);
    }
  }, []);

  const hasAccess = state.subscribed || state.trialActive;

  return { ...state, hasAccess, checkSubscription, openCheckout, openPortal };
}
