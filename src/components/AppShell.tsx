import { useApp, View } from '@/contexts/AppContext';
import { saveState } from '@/lib/store';
import DashboardView from './views/DashboardView';
import LancamentosView from './views/LancamentosView';
import FixasView from './views/FixasView';
import AgendaView from './views/AgendaView';
import ResumoView from './views/ResumoView';
import ConfigView from './views/ConfigView';

const VIEWS: { id: View; name: string; subtitle: string }[] = [
  { id: 'dashboard', name: 'Painel do Mês', subtitle: 'Veja rapidamente quanto entrou, quanto saiu e o que ainda falta pagar.' },
  { id: 'lancamentos', name: 'Receitas e Despesas', subtitle: 'Cadastre entradas e saídas do mês de forma simples.' },
  { id: 'fixas', name: 'Contas Fixas', subtitle: 'Contas que se repetem todo mês para você não esquecer.' },
  { id: 'agenda', name: 'Agenda de Vencimentos', subtitle: 'Saiba o que vence hoje, nesta semana e o que está atrasado.' },
  { id: 'resumo', name: 'Resumo do Mês', subtitle: 'Entenda o seu mês em linguagem simples.' },
  { id: 'config', name: 'Configurações', subtitle: 'Ajustes básicos, backup e personalização.' },
];

export default function AppShell() {
  const { state, currentView, setCurrentView, setScreen, reloadDemo } = useApp();
  const meta = VIEWS.find(v => v.id === currentView)!;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-screen">
      {/* Sidebar */}
      <aside className="p-5 px-4 lg:border-r border-border lg:sticky lg:top-0 lg:h-screen" style={{ background: 'hsla(222,55%,8%,0.86)', backdropFilter: 'blur(12px)' }}>
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
              className={`w-full text-left px-3.5 py-3 rounded-[15px] border text-sm cursor-pointer transition-colors ${
                v.id === currentView ? 'bg-card border-border' : 'bg-transparent border-transparent hover:bg-card hover:border-border'
              }`}
            >
              {v.name}
            </button>
          ))}
        </nav>
        <div className="mt-4 p-3.5 rounded-[18px] bg-card border border-border">
          <small className="block text-muted-foreground leading-relaxed text-xs">App offline em arquivo único. Os dados ficam salvos no navegador do aparelho.</small>
        </div>
        <div className="mt-3 p-3.5 rounded-[18px] bg-card border border-border">
          <small className="block text-muted-foreground leading-relaxed text-xs"><strong className="text-foreground">Público-alvo:</strong> pessoas leigas, famílias, autônomos simples e usuários que desistiram de apps financeiros complexos.</small>
        </div>
      </aside>

      {/* Main */}
      <main className="p-4 lg:p-6">
        <div className="glass-panel rounded-3xl p-4 lg:p-5 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{meta.name}</h2>
            <p className="text-muted-foreground text-sm">{meta.subtitle}</p>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <button onClick={() => setScreen('landing')} className="glass-panel rounded-2xl px-3 py-2.5 font-bold cursor-pointer text-xs">Tela inicial</button>
            <button onClick={reloadDemo} className="glass-panel rounded-2xl px-3 py-2.5 font-bold cursor-pointer text-xs">Recarregar demo</button>
            <button onClick={exportBackup} className="glass-panel rounded-2xl px-3 py-2.5 font-bold cursor-pointer text-xs">Exportar backup</button>
            <label className="glass-panel rounded-2xl px-3 py-2.5 font-bold cursor-pointer text-xs">
              Importar backup
              <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        <div className="animate-fade-in">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'lancamentos' && <LancamentosView />}
          {currentView === 'fixas' && <FixasView />}
          {currentView === 'agenda' && <AgendaView />}
          {currentView === 'resumo' && <ResumoView />}
          {currentView === 'config' && <ConfigView />}
        </div>
      </main>
    </div>
  );
}
