import { useApp } from '@/contexts/AppContext';
import { makeDemoData, saveState } from '@/lib/store';

export default function ConfigView() {
  const { state, updateState, reloadDemo } = useApp();

  function saveName() {
    const input = document.getElementById('configUserName') as HTMLInputElement;
    updateState(prev => ({ ...prev, userName: input.value.trim() }));
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conta_clara_lite_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    if (!confirm('Deseja apagar todos os dados salvos neste navegador?')) return;
    updateState(() => ({ brandName: 'Conta Clara Lite', userName: '', fixedBills: [], entries: [] }));
  }

  return (
    <div>
      <div className="glass-panel p-4 mb-4">
        <h3 className="font-bold mb-1">Dados do usuário</h3>
        <p className="text-muted-foreground text-sm mb-3">Apenas o básico para personalização</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Nome</label>
            <input id="configUserName" defaultValue={state.userName || ''} placeholder="Seu nome" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-end">
            <button onClick={saveName} className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground">Salvar nome</button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4">
        <h3 className="font-bold mb-1">Backup e limpeza</h3>
        <p className="text-muted-foreground text-sm mb-3">O app funciona com armazenamento local no próprio navegador</p>
        <div className="flex gap-2.5 flex-wrap">
          <button onClick={exportBackup} className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm">Exportar backup</button>
          <button onClick={reloadDemo} className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm">Recarregar dados demo</button>
          <button onClick={clearAll} className="badge-bad cursor-pointer px-4 py-2.5 rounded-2xl font-bold text-sm">Apagar tudo</button>
        </div>
        <div className="mt-3.5 text-xs text-muted-foreground">Versão v3 comercial, pronta para demo, validação e início de narrativa de venda.</div>
      </div>
    </div>
  );
}
