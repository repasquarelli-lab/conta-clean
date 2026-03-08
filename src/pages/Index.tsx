import { AppProvider, useApp } from '@/contexts/AppContext';
import Landing from '@/components/Landing';
import Auth from '@/components/Auth';
import AppShell from '@/components/AppShell';

function ScreenRouter() {
  const { screen } = useApp();
  if (screen === 'landing') return <Landing />;
  if (screen === 'auth') return <Auth />;
  return <AppShell />;
}

const Index = () => (
  <AppProvider>
    <ScreenRouter />
  </AppProvider>
);

export default Index;
