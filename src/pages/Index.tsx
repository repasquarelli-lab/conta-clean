import { AppProvider, useApp } from '@/contexts/AppContext';
import Landing from '@/components/Landing';
import Auth from '@/components/Auth';
import AppShell from '@/components/AppShell';
import SubscriptionPaywall from '@/components/SubscriptionPaywall';
import { useSubscription } from '@/hooks/useSubscription';
import { useReferral } from '@/hooks/useReferral';
import { useDataExport } from '@/hooks/useDataExport';

function ScreenRouter() {
  const { screen, onAuthSuccess, logout } = useApp();
  const { hasAccess, loading: subLoading, openCheckout, dataRetentionDaysLeft } = useSubscription(onAuthSuccess.user);
  const { referralCode } = useReferral(onAuthSuccess.user);
  const { exportCSV, exportPDF, exporting } = useDataExport(onAuthSuccess.user?.id);

  if (screen === 'landing') return <Landing />;
  if (screen === 'auth') return <Auth />;

  // User is authenticated — check subscription/trial
  if (subLoading) {
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
