import { useState, useRef, useEffect } from 'react';
import { useApp, View } from '@/contexts/AppContext';
import { saveState, overdueBills, dueTodayBills, currency, budgetProgress, todayISO } from '@/lib/store';
import { LayoutDashboard, ArrowLeftRight, Pin, CalendarClock, FileText, Settings, Menu, X, LogOut, Sun, Moon, Download, Upload, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import AppLogo from './AppLogo';
import AiTipsWidget from './AiTipsWidget';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/integrations/supabase/client';

const VIEW_ORDER: View[] = ['dashboard', 'lancamentos', 'fixas', 'agenda', 'resumo', 'config', 'admin'];
import DashboardView from './views/DashboardView';
import LancamentosView from './views/LancamentosView';
import FixasView from './views/FixasView';
import AgendaView from './views/AgendaView';
import ResumoView from './views/ResumoView';
import ConfigView from './views/ConfigView';
import AdminView from './views/AdminView';

const VIEWS: { id: View; name: string; shortName: string; subtitle: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', name: 'Painel do Mês', shortName: 'Painel', subtitle: 'Veja rapidamente quanto entrou, quanto saiu e o que ainda falta pagar.', icon: LayoutDashboard },
  { id: 'lancamentos', name: 'Receitas e Despesas', shortName: 'Lançar', subtitle: 'Cadastre entradas e saídas do mês de forma simples.', icon: ArrowLeftRight },
  { id: 'fixas', name: 'Contas Fixas', shortName: 'Fixas', subtitle: 'Contas que se repetem todo mês para você não esquecer.', icon: Pin },
  { id: 'agenda', name: 'Agenda de Vencimentos', shortName: 'Agenda', subtitle: 'Saiba o que vence hoje, nesta semana e o que está atrasado.', icon: CalendarClock },
  { id: 'resumo', name: 'Resumo do Mês', shortName: 'Resumo', subtitle: 'Entenda o seu mês em linguagem simples.', icon: FileText },
  { id: 'config', name: 'Configurações', shortName: 'Config', subtitle: 'Ajustes básicos, backup e personalização.', icon: Settings },
  { id: 'admin', name: 'Administração', shortName: 'Admin', subtitle: 'Gerencie usuários e papéis da plataforma.', icon: ShieldCheck },
];

// Bottom tabs: show 5 main views, config and admin go in hamburger
const BOTTOM_TABS = VIEWS.filter(v => v.id !== 'config' && v.id !== 'admin');

export default function AppShell() {
  const { state, currentView, setCurrentView, setScreen, reloadDemo, logout, onAuthSuccess } = useApp();
  const userEmail = onAuthSuccess.user?.email || '';
  const userId = onAuthSuccess.user?.id || '';
  const { theme, toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const meta = VIEWS.find(v => v.id === currentView)!;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevViewRef = useRef(currentView);
  const direction = VIEW_ORDER.indexOf(currentView) >= VIEW_ORDER.indexOf(prevViewRef.current) ? 1 : -1;
  prevViewRef.current = currentView;

  // Check admin role
  useEffect(() => {
    if (!userId) return;
    supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);

  const visibleViews = VIEWS.filter(v => v.id !== 'admin' || isAdmin);

  useEffect(() => {
    const overdue = overdueBills(state);
    const dueToday = dueTodayBills(state);
    if (overdue.length > 0) {
      const total = overdue.reduce((s, e) => s + Number(e.value || 0), 0);
      toast.error(`⚠️ ${overdue.length} conta${overdue.length > 1 ? 's' : ''} atrasada${overdue.length > 1 ? 's' : ''}`, {
        description: `Total em atraso: ${currency(total)}`,
        duration: 6000,
      });
    }
    if (dueToday.length > 0) {
      const total = dueToday.reduce((s, e) => s + Number(e.value || 0), 0);
      toast.warning(`📅 ${dueToday.length} conta${dueToday.length > 1 ? 's' : ''} vence${dueToday.length > 1 ? 'm' : ''} hoje`, {
        description: `Total: ${currency(total)}`,
        duration: 6000,
      });
    }

    // Budget alerts
    const currentMonth = todayISO().slice(0, 7);
    const budgets = budgetProgress(state, currentMonth);
    const exceeded = budgets.filter(b => b.pct > 100);
    const nearLimit = budgets.filter(b => b.pct >= 80 && b.pct <= 100);

    if (exceeded.length > 0) {
      toast.error(`🚨 ${exceeded.length} categoria${exceeded.length > 1 ? 's' : ''} estourou o orçamento`, {
        description: exceeded.map(b => `${b.category}: ${currency(b.spent)} de ${currency(b.limit)} (${b.pct}%)`).join(' · '),
        duration: 8000,
      });
    }
    if (nearLimit.length > 0) {
      toast.warning(`⚡ ${nearLimit.length} categoria${nearLimit.length > 1 ? 's' : ''} perto do limite`, {
        description: nearLimit.map(b => `${b.category}: ${b.pct}% usado`).join(' · '),
        duration: 6000,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conta_clara_lite_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.fixedBills)) throw new Error('Formato inválido');
        saveState(parsed);
        window.location.reload();
      } catch {
        toast.error('Não foi possível importar o arquivo.');
      }
    };
    reader.readAsText(file);
  }

  function navigateTo(viewId: View) {
    setCurrentView(viewId);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-[280px_1fr]">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-xl" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <AppLogo size="sm" subtitle={state.userName ? `Olá, ${state.userName}` : 'Finanças'} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-xl grid place-items-center bg-card border border-border cursor-pointer active:scale-95 transition-transform" title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-10 h-10 rounded-xl grid place-items-center bg-card border border-border cursor-pointer active:scale-95 transition-transform">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-down Menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-30 bg-background/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="lg:hidden fixed top-[57px] left-0 right-0 z-40 border-b border-border p-4 bg-background/98 backdrop-blur-2xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <nav className="flex flex-col gap-1.5 mb-3">
                {visibleViews.map(v => (
                  <button
                    key={v.id}
                    onClick={() => navigateTo(v.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl border text-sm cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3 ${
                      v.id === currentView ? 'bg-card border-border shadow-sm' : 'bg-transparent border-transparent'
                    }`}
                  >
                    <v.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">{v.name}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{v.subtitle}</p>
                    </div>
                  </button>
                ))}
              </nav>
              <div className="border-t border-border pt-3 flex flex-wrap gap-2">
                <button onClick={() => { logout(); setSidebarOpen(false); }} className="glass-panel rounded-xl px-3 py-2.5 font-bold cursor-pointer text-xs flex items-center gap-2 text-destructive active:scale-95 transition-transform">
                  <LogOut className="w-3.5 h-3.5" /> Sair da conta
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col p-5 px-4 border-r border-border sticky top-0 h-screen bg-background/90 backdrop-blur-xl">
        <div className="pb-5 px-2">
          <AppLogo size="md" subtitle={state.userName ? `Olá, ${state.userName}` : 'Seu controle financeiro'} />
        </div>
        <nav className="flex flex-col gap-1.5 flex-1">
          {visibleViews.map(v => (
            <motion.button
              key={v.id}
              onClick={() => setCurrentView(v.id)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl border text-sm cursor-pointer transition-colors flex items-center gap-3 ${
                v.id === currentView ? 'bg-card border-border shadow-sm' : 'bg-transparent border-transparent hover:bg-card/50 hover:border-border/50'
              }`}
            >
              <v.icon className={`w-4 h-4 shrink-0 transition-colors ${v.id === currentView ? 'text-primary' : 'text-muted-foreground'}`} />
              {v.name}
            </motion.button>
          ))}
        </nav>
        {/* User info */}
        <div className="mt-auto space-y-2">
          <div className="p-3.5 rounded-2xl bg-card border border-border">
            <p className="text-sm font-semibold truncate">{state.userName || 'Usuário'}</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{userEmail}</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between">
            <small className="text-muted-foreground leading-relaxed text-xs">Tema</small>
            <button onClick={toggleTheme} className="w-9 h-9 rounded-xl grid place-items-center bg-accent border border-border cursor-pointer hover:bg-muted transition-colors" title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-x-hidden">
        {/* Desktop header bar */}
        <div className="glass-panel rounded-3xl p-4 lg:p-5 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center mb-4">
          <div>
            <h2 className="text-lg lg:text-2xl font-bold mb-0.5">{meta.name}</h2>
            <p className="text-muted-foreground text-sm hidden sm:block">{meta.subtitle}</p>
          </div>
          <div className="hidden lg:flex gap-2 items-center">
            <button onClick={logout} className="flex items-center gap-1.5 glass-panel rounded-xl px-3 py-2 font-semibold cursor-pointer text-xs text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: direction * 50, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -50, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'lancamentos' && <LancamentosView />}
              {currentView === 'fixas' && <FixasView />}
              {currentView === 'agenda' && <AgendaView />}
              {currentView === 'resumo' && <ResumoView />}
              {currentView === 'config' && <ConfigView />}
              {currentView === 'admin' && isAdmin && <AdminView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border flex bg-background/95 backdrop-blur-2xl safe-bottom">
        {BOTTOM_TABS.map(v => {
          const isActive = v.id === currentView;
          return (
            <motion.button
              key={v.id}
              onClick={() => setCurrentView(v.id)}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 cursor-pointer border-none bg-transparent ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <v.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              </motion.div>
              <span className="text-[10px] font-semibold leading-tight">{v.shortName}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomTabIndicator"
                  className="w-5 h-0.5 rounded-full brand-gradient mt-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>
      {/* Floating AI Copilot */}
      <AiTipsWidget />
    </div>
  );
}
