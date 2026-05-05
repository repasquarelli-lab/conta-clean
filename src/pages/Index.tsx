import { useEffect, useState } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import Landing from '@/components/Landing';
import Auth from '@/components/Auth';
import AppShell from '@/components/AppShell';
import SubscriptionPaywall from '@/components/SubscriptionPaywall';
import TwoFactorChallenge from '@/components/TwoFactorChallenge';
import { useSubscription } from '@/hooks/useSubscription';
import { useReferral } from '@/hooks/useReferral';
import { useDataExport } from '@/hooks/useDataExport';
import { supabase } from '@/integrations/supabase/client';

function ScreenRouter() {
  const { screen, onAuthSuccess, logout } = useApp();
  const { hasAccess, loading: subLoading, openCheckout, dataRetentionDaysLeft } = useSubscription(onAuthSuccess.user);
  const { referralCode } = useReferral(onAuthSuccess.user);
  const { exportCSV, exportPDF, exporting } = useDataExport(onAuthSuccess.user?.id);

  const [mfaState, setMfaState] = useState<'checking' | 'required' | 'ok'>('checking');

  useEffect(() => {
    if (!onAuthSuccess.user) { setMfaState('checking'); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (error) { setMfaState('ok'); return; }
      if (data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2') {
        setMfaState('required');
      } else {
        setMfaState('ok');
      }
    })();
    return () => { cancelled = true; };
  }, [onAuthSuccess.user?.id]);

  if (screen === 'landing') return <Landing />;
  if (screen === 'auth') return <Auth />;

  if (mfaState === 'required') {
    return <TwoFactorChallenge onSuccess={() => setMfaState('ok')} onCancel={logout} />;
  }

  // User is authenticated — check subscription/trial
  if (subLoading || mfaState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verificando assinatura...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <SubscriptionPaywall
        onCheckout={openCheckout}
        onBack={logout}
        referralCode={referralCode || undefined}
        dataRetentionDaysLeft={dataRetentionDaysLeft}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
        exporting={exporting}
      />
    );
  }

  return <AppShell />;
}

const Index = () => (
  <AppProvider>
    <ScreenRouter />
  </AppProvider>
);

export default Index;
