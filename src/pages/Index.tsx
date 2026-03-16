import { AppProvider, useApp } from '@/contexts/AppContext';
import Landing from '@/components/Landing';
import Auth from '@/components/Auth';
import AppShell from '@/components/AppShell';
import SubscriptionPaywall from '@/components/SubscriptionPaywall';
import { useSubscription } from '@/hooks/useSubscription';

function ScreenRouter() {
  const { screen, onAuthSuccess } = useApp();
  const { hasAccess, loading: subLoading, openCheckout } = useSubscription(onAuthSuccess.user);

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
    return <SubscriptionPaywall onCheckout={openCheckout} />;
  }

  return <AppShell />;
}

const Index = () => (
  <AppProvider>
    <ScreenRouter />
  </AppProvider>
);

export default Index;
