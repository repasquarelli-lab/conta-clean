import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { readCheckoutAttempt, saveCheckoutAttempt, clearCheckoutAttempt, shouldOfferRecovery } from '@/lib/checkoutRecovery';

interface SubscriptionState {
  subscribed: boolean;
  trialActive: boolean;
  trialDaysLeft: number;
  subscriptionEnd: string | null;
  dataRetentionDaysLeft: number | null;
  loading: boolean;
}

export function useSubscription(user: User | null) {
  const [recoveryOffer, setRecoveryOffer] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const returned = useRef(true);
  const checking = useRef(0);
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    trialActive: true,
    trialDaysLeft: 3,
    subscriptionEnd: null,
    dataRetentionDaysLeft: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const request = ++checking.current;
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      if (request !== checking.current) return;
      if (data.subscribed) clearCheckoutAttempt(user.id);
      setRecoveryOffer(shouldOfferRecovery(readCheckoutAttempt(user.id), data.subscribed, returned.current));

      setState({
        subscribed: data.subscribed,
        trialActive: data.trial_active,
        trialDaysLeft: data.trial_days_left,
        subscriptionEnd: data.subscription_end,
        dataRetentionDaysLeft: data.data_retention_days_left ?? null,
        loading: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    returned.current = true;
    setRecoveryOffer(false);
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);

    // Re-check when tab regains focus (e.g. returning from Stripe checkout)
    const handleFocus = () => { returned.current = true; checkSubscription(); };
    const handleVisibility = () => { if (document.visibilityState === 'visible') handleFocus(); };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Handle ?subscription=success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      // Remove query param and force re-check
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.pathname);
      checkSubscription();
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      checking.current++;
    };
  }, [checkSubscription]);

  const openCheckout = useCallback(async (plan: 'monthly' | 'annual' = 'monthly') => {
    if (!user || checkoutLoading) return;
    setCheckoutLoading(true);
    const checkoutWindow = window.open('about:blank', '_blank');
    if (checkoutWindow) checkoutWindow.opener = null;
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Checkout URL missing');
      saveCheckoutAttempt(user.id, plan);
      returned.current = false;
      setRecoveryOffer(false);
      if (checkoutWindow) checkoutWindow.location.href = data.url;
      else window.location.assign(data.url);
    } catch (err) {
      checkoutWindow?.close();
      toast.error('Não foi possível abrir o pagamento. Tente novamente.');
      console.error('Error creating checkout:', err);
    } finally {
      setCheckoutLoading(false);
    }
  }, [user, checkoutLoading]);

  const dismissRecoveryOffer = useCallback(() => {
    if (user) clearCheckoutAttempt(user.id);
    setRecoveryOffer(false);
  }, [user]);

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

  return { ...state, hasAccess, checkSubscription, openCheckout, openPortal, recoveryOffer, dismissRecoveryOffer, checkoutLoading };
}
