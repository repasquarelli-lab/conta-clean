import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { categories, currency, BudgetGoal } from '@/lib/store';
import { Plus, Trash2, Mail, User, Target, Download, RefreshCw, AlertTriangle, Save, Database } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

export default function ConfigView() {
  const { state, updateState, reloadDemo, onAuthSuccess } = useApp();
  const userEmail = onAuthSuccess.user?.email || '';
  const [newCat, setNewCat] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const goals = state.budgetGoals || [];
  const usedCategories = goals.map(g => g.category);
  const availableCategories = categories.filter(c => !usedCategories.includes(c));

  function saveName() {
    const input = document.getElementById('configUserName') as HTMLInputElement;
    updateState(prev => ({ ...prev, userName: input.value.trim() }));
  }

  function addGoal() {
    const cat = newCat || availableCategories[0];
    const limit = Number(newLimit);
    if (!cat || limit <= 0) return;
    updateState(prev => ({
      ...prev,
      budgetGoals: [...(prev.budgetGoals || []), { category: cat, limit }],
    }));
    setNewCat('');
    setNewLimit('');
  }

  function removeGoal(category: string) {
    updateState(prev => ({
      ...prev,
      budgetGoals: (prev.budgetGoals || []).filter(g => g.category !== category),
    }));
  }

  function updateGoalLimit(category: string, newVal: string) {
    const limit = Number(newVal);
    if (limit < 0) return;
    updateState(prev => ({
      ...prev,
      budgetGoals: (prev.budgetGoals || []).map(g =>
        g.category === category ? { ...g, limit } : g
      ),
    }));
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
    updateState(() => ({ brandName: 'Conta Clara Lite', userName: '', fixedBills: [], entries: [], budgetGoals: [] }));
  }

  return (
    <div>
      <div className="glass-panel p-4 mb-4">
        <div className="flex items-start gap-2.5 mb-3">
          <User className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Dados do usuário</h3>
            <p className="text-muted-foreground text-sm">Apenas o básico para personalização</p>
          </div>
        </div>
        {userEmail && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent border border-border mb-3">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground truncate">{userEmail}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Nome</label>
            <input id="configUserName" defaultValue={state.userName || ''} placeholder="Seu nome" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-end">
            <button onClick={saveName} className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5"><Save className="size-4" strokeWidth={1.5} /> Salvar nome</button>
          </div>
        </div>
      </div>

      {/* Budget Goals */}
      <div className="glass-panel p-4 mb-4">
        <h3 className="font-bold mb-1">Metas de orçamento</h3>
        <p className="text-muted-foreground text-sm mb-3">Defina limites de gasto por categoria para controlar seu mês</p>

        {goals.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {goals.map(g => (
              <div key={g.category} className="flex items-center gap-2 p-2.5 rounded-xl bg-accent border border-border">
                <span className="text-sm font-medium flex-1">{g.category}</span>
                <span className="text-xs text-muted-foreground">R$</span>
                <input
                  type="number"
                  value={g.limit}
                  onChange={(e) => updateGoalLimit(g.category, e.target.value)}
                  className="w-24 px-2 py-1.5 rounded-lg border border-border bg-input text-foreground text-sm outline-none text-right"
                  min="0"
                  step="50"
                />
                <button onClick={() => removeGoal(g.category)} className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors cursor-pointer" title="Remover">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}

        {availableCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs font-medium mb-1 block">Categoria</label>
              <select
                value={newCat || availableCategories[0]}
                onChange={(e) => setNewCat(e.target.value)}
                className="px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none"
              >
                {availableCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Limite (R$)</label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="500"
                min="0"
                step="50"
                className="w-28 px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button onClick={addGoal} className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        )}

        {goals.length === 0 && availableCategories.length === 0 && (
          <p className="text-muted-foreground text-sm">Nenhuma categoria disponível.</p>
        )}
      </div>

      <div className="glass-panel p-4">
        <h3 className="font-bold mb-1">Backup e limpeza</h3>
        <p className="text-muted-foreground text-sm mb-3">Seus dados são sincronizados na nuvem automaticamente</p>
        <div className="flex gap-2.5 flex-wrap">
          <button onClick={exportBackup} className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm">Exportar backup</button>
          <button onClick={reloadDemo} className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm">Carregar dados demo</button>
          <button onClick={clearAll} className="badge-bad cursor-pointer px-4 py-2.5 rounded-2xl font-bold text-sm">Apagar tudo</button>
        </div>
        <div className="mt-3.5 text-xs text-muted-foreground">Conta Clara v1.0 · Suas finanças, simples e seguras.</div>
      </div>
    </div>
  );
}
