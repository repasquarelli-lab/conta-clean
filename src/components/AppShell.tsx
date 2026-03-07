import { useState, useRef, useEffect } from 'react';
import { useApp, View } from '@/contexts/AppContext';
import { saveState, overdueBills, dueTodayBills, currency } from '@/lib/store';
import { LayoutDashboard, ArrowLeftRight, Pin, CalendarClock, FileText, Settings, Menu, X, Home } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

const VIEW_ORDER: View[] = ['dashboard', 'lancamentos', 'fixas', 'agenda', 'resumo', 'config'];
import DashboardView from './views/DashboardView';
import LancamentosView from './views/LancamentosView';
import FixasView from './views/FixasView';
import AgendaView from './views/AgendaView';
import ResumoView from './views/ResumoView';
import ConfigView from './views/ConfigView';

const VIEWS: { id: View; name: string; shortName: string; subtitle: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', name: 'Painel do Mês', shortName: 'Painel', subtitle: 'Veja rapidamente quanto entrou, quanto saiu e o que ainda falta pagar.', icon: LayoutDashboard },
  { id: 'lancamentos', name: 'Receitas e Despesas', shortName: 'Lançar', subtitle: 'Cadastre entradas e saídas do mês de forma simples.', icon: ArrowLeftRight },
  { id: 'fixas', name: 'Contas Fixas', shortName: 'Fixas', subtitle: 'Contas que se repetem todo mês para você não esquecer.', icon: Pin },
  { id: 'agenda', name: 'Agenda de Vencimentos', shortName: 'Agenda', subtitle: 'Saiba o que vence hoje, nesta semana e o que está atrasado.', icon: CalendarClock },
  { id: 'resumo', name: 'Resumo do Mês', shortName: 'Resumo', subtitle: 'Entenda o seu mês em linguagem simples.', icon: FileText },
  { id: 'config', name: 'Configurações', shortName: 'Config', subtitle: 'Ajustes básicos, backup e personalização.', icon: Settings },
];

// Bottom tabs: show 5 main views, config goes in hamburger
const BOTTOM_TABS = VIEWS.filter(v => v.id !== 'config');

export default function AppShell() {
  const { state, currentView, setCurrentView, setScreen, reloadDemo } = useApp();
  const meta = VIEWS.find(v => v.id === currentView)!;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevViewRef = useRef(currentView);
  const direction = VIEW_ORDER.indexOf(currentView) >= VIEW_ORDER.indexOf(prevViewRef.current) ? 1 : -1;
  prevViewRef.current = currentView;

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
        alert('Não foi possível importar o arquivo.');
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
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 z-40" style={{ background: 'hsla(222,55%,8%,0.96)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl grid place-items-center brand-gradient font-black tracking-wide text-primary-foreground text-xs">CC</div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Conta Clara</h1>
            <p className="text-[10px] text-muted-foreground">{state.userName ? `Olá, ${state.userName}` : 'Seu mês'}</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-10 h-10 rounded-xl grid place-items-center bg-card border border-border cursor-pointer">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Slide-down Menu */}
      {sidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-30 bg-background/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="lg:hidden fixed top-[57px] left-0 right-0 z-40 border-b border-border p-4 animate-fade-in" style={{ background: 'hsla(222,55%,8%,0.98)', backdropFilter: 'blur(16px)' }}>
            <nav className="flex flex-col gap-1.5 mb-3">
              {VIEWS.map(v => (
                <button
                  key={v.id}
                  onClick={() => navigateTo(v.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border text-sm cursor-pointer transition-colors flex items-center gap-3 ${
                    v.id === currentView ? 'bg-card border-border' : 'bg-transparent border-transparent'
                  }`}
                >
                  <v.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  {v.name}
                </button>
              ))}
            </nav>
            <div className="border-t border-border pt-3 flex flex-wrap gap-2">
              <button onClick={() => { setScreen('landing'); setSidebarOpen(false); }} className="glass-panel rounded-xl px-3 py-2 font-bold cursor-pointer text-xs flex items-center gap-2">
                <Home className="w-3.5 h-3.5" /> Tela inicial
              </button>
              <button onClick={() => { reloadDemo(); setSidebarOpen(false); }} className="glass-panel rounded-xl px-3 py-2 font-bold cursor-pointer text-xs">Recarregar demo</button>
              <button onClick={exportBackup} className="glass-panel rounded-xl px-3 py-2 font-bold cursor-pointer text-xs">Exportar</button>
              <label className="glass-panel rounded-xl px-3 py-2 font-bold cursor-pointer text-xs">
                Importar
                <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block p-5 px-4 border-r border-border sticky top-0 h-screen" style={{ background: 'hsla(222,55%,8%,0.86)', backdropFilter: 'blur(12px)' }}>
        <div className="flex gap-3 items-center pb-4 px-2">
          <div className="w-12 h-12 rounded-2xl grid place-items-center brand-gradient font-black tracking-wide text-primary-foreground text-sm">CC</div>
          <div>
            <h1 className="text-sm font-bold">Conta Clara Lite</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{state.userName ? `Olá, ${state.userName}` : 'Seu mês, sem complicação'}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setCurrentView(v.id)}
              className={`w-full text-left px-3.5 py-3 rounded-[15px] border text-sm cursor-pointer transition-colors flex items-center gap-3 ${
                v.id === currentView ? 'bg-card border-border' : 'bg-transparent border-transparent hover:bg-card hover:border-border'
              }`}
            >
              <v.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              {v.name}
            </button>
          ))}
        </nav>
        <div className="mt-4 p-3.5 rounded-[18px] bg-card border border-border">
          <small className="block text-muted-foreground leading-relaxed text-xs">App offline. Dados salvos no navegador.</small>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        {/* Desktop header bar */}
        <div className="glass-panel rounded-3xl p-4 lg:p-5 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold mb-1">{meta.name}</h2>
            <p className="text-muted-foreground text-sm hidden sm:block">{meta.subtitle}</p>
          </div>
          <div className="hidden lg:flex gap-2.5 flex-wrap">
            <button onClick={() => setScreen('landing')} className="glass-panel rounded-2xl px-3 py-2.5 font-bold cursor-pointer text-xs">Tela inicial</button>
            <button onClick={reloadDemo} className="glass-panel rounded-2xl px-3 py-2.5 font-bold cursor-pointer text-xs">Recarregar demo</button>
            <button onClick={exportBackup} className="glass-panel rounded-2xl px-3 py-2.5 font-bold cursor-pointer text-xs">Exportar backup</button>
            <label className="glass-panel rounded-2xl px-3 py-2.5 font-bold cursor-pointer text-xs">
              Importar backup
              <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'lancamentos' && <LancamentosView />}
              {currentView === 'fixas' && <FixasView />}
              {currentView === 'agenda' && <AgendaView />}
              {currentView === 'resumo' && <ResumoView />}
              {currentView === 'config' && <ConfigView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border flex" style={{ background: 'hsla(222,55%,8%,0.96)', backdropFilter: 'blur(16px)' }}>
        {BOTTOM_TABS.map(v => {
          const isActive = v.id === currentView;
          return (
            <button
              key={v.id}
              onClick={() => setCurrentView(v.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 pt-3 cursor-pointer transition-colors border-none bg-transparent ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <v.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-semibold leading-tight">{v.shortName}</span>
              {isActive && <div className="w-5 h-0.5 rounded-full brand-gradient mt-0.5" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
