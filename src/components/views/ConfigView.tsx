import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getAllCategories, getAllIncomeCategories, defaultCategories, defaultIncomeCategories, currency, BudgetGoal, defaultNotificationSettings } from '@/lib/store';
import { Plus, Trash2, Mail, User, Target, Download, RefreshCw, AlertTriangle, Save, Database, Bell, BellOff, Sun, Moon, Monitor, Tag, X, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { useTheme } from '@/hooks/use-theme';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ConfigView() {
  const { state, updateState, reloadDemo, onAuthSuccess } = useApp();
  const { theme, mode, setTheme, toggleTheme } = useTheme();
  const userEmail = onAuthSuccess.user?.email || '';
  const [newCat, setNewCat] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [newCustomCat, setNewCustomCat] = useState('');
  const [newCustomIncomeCat, setNewCustomIncomeCat] = useState('');

  const allCategories = getAllCategories(state);
  const allIncomeCategories = getAllIncomeCategories(state);
  const goals = state.budgetGoals || [];
  const usedCategories = goals.map(g => g.category);
  const availableCategories = allCategories.filter(c => !usedCategories.includes(c));

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

  function addCustomCategory() {
    const name = newCustomCat.trim();
    if (!name) return;
    if (allCategories.includes(name)) {
      toast.error('Essa categoria já existe!');
      return;
    }
    updateState(prev => ({
      ...prev,
      customCategories: [...(prev.customCategories || []), name],
    }));
    setNewCustomCat('');
    toast.success(`Categoria "${name}" criada!`);
  }

  function removeCustomCategory(name: string) {
    updateState(prev => ({
      ...prev,
      customCategories: (prev.customCategories || []).filter(c => c !== name),
    }));
    toast.success(`Categoria "${name}" removida.`);
  }

  function addCustomIncomeCategory() {
    const name = newCustomIncomeCat.trim();
    if (!name) return;
    if (allIncomeCategories.includes(name)) {
      toast.error('Essa categoria já existe!');
      return;
    }
    updateState(prev => ({
      ...prev,
      customIncomeCategories: [...(prev.customIncomeCategories || []), name],
    }));
    setNewCustomIncomeCat('');
    toast.success(`Categoria de receita "${name}" criada!`);
  }

  function removeCustomIncomeCategory(name: string) {
    updateState(prev => ({
      ...prev,
      customIncomeCategories: (prev.customIncomeCategories || []).filter(c => c !== name),
    }));
    toast.success(`Categoria "${name}" removida.`);
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

      {/* Appearance / Theme */}
      <div className="glass-panel p-4 mb-4">
        <div className="flex items-start gap-2.5 mb-3">
          <Sun className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Aparência</h3>
            <p className="text-muted-foreground text-sm">Escolha o tema do aplicativo</p>
          </div>
        </div>
        <div className="flex gap-2">
          {([
            { value: 'light' as const, label: 'Claro', icon: Sun },
            { value: 'dark' as const, label: 'Escuro', icon: Moon },
            { value: 'system' as const, label: 'Sistema', icon: Monitor },
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                mode === opt.value
                  ? 'bg-primary/10 border-primary text-primary font-semibold'
                  : 'bg-accent border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              <opt.icon className="size-4" strokeWidth={1.5} />
              <span className="text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Categories */}
      <div className="glass-panel p-4 mb-4">
        <div className="flex items-start gap-2.5 mb-3">
          <Tag className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Categorias personalizadas</h3>
            <p className="text-muted-foreground text-sm">Crie categorias além das padrões para organizar melhor</p>
          </div>
        </div>

        {/* Expense categories */}
        <div className="mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Categorias de despesa</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {defaultCategories.map(c => {
              const CatIcon = getCategoryIcon(c);
              return (
                <span key={c} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent border border-border text-xs text-muted-foreground">
                  <CatIcon className="size-3" strokeWidth={1.5} /> {c}
                </span>
              );
            })}
            <AnimatePresence>
              {(state.customCategories || []).map(c => (
                <motion.span
                  key={c}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary font-medium"
                >
                  {c}
                  <button onClick={() => removeCustomCategory(c)} className="hover:text-destructive cursor-pointer transition-colors">
                    <X className="size-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <input
              value={newCustomCat}
              onChange={e => setNewCustomCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
              placeholder="Nome da nova categoria..."
              className="flex-1 px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground"
              maxLength={30}
            />
            <button onClick={addCustomCategory} className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5 shrink-0">
              <Plus className="size-4" /> Adicionar
            </button>
          </div>
        </div>

        {/* Income categories */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Categorias de receita</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {defaultIncomeCategories.map(c => {
              const CatIcon = getCategoryIcon(c);
              return (
                <span key={c} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent border border-border text-xs text-muted-foreground">
                  <CatIcon className="size-3" strokeWidth={1.5} /> {c}
                </span>
              );
            })}
            <AnimatePresence>
              {(state.customIncomeCategories || []).map(c => (
                <motion.span
                  key={c}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary font-medium"
                >
                  {c}
                  <button onClick={() => removeCustomIncomeCategory(c)} className="hover:text-destructive cursor-pointer transition-colors">
                    <X className="size-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <input
              value={newCustomIncomeCat}
              onChange={e => setNewCustomIncomeCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomIncomeCategory()}
              placeholder="Nome da nova categoria..."
              className="flex-1 px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground"
              maxLength={30}
            />
            <button onClick={addCustomIncomeCategory} className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5 shrink-0">
              <Plus className="size-4" /> Adicionar
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 mb-4">
        <div className="flex items-start gap-2.5 mb-3">
          <Target className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Metas de orçamento</h3>
            <p className="text-muted-foreground text-sm">Defina limites de gasto por categoria para controlar seu mês</p>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {goals.map(g => (
              <div key={g.category} className="flex items-center gap-2 p-2.5 rounded-xl bg-accent border border-border">
                {(() => { const CatIcon = getCategoryIcon(g.category); return <CatIcon className="size-4 text-muted-foreground shrink-0" strokeWidth={1.5} />; })()}
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

      {/* Notification Settings */}
      <div className="glass-panel p-4 mb-4">
        <div className="flex items-start gap-2.5 mb-3">
          <Bell className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Notificações</h3>
            <p className="text-muted-foreground text-sm">Configure alertas de vencimento e atraso</p>
          </div>
        </div>
        {(() => {
          const notifSettings = state.notificationSettings || defaultNotificationSettings;
          const permissionStatus = 'Notification' in window ? Notification.permission : 'unsupported';

          const toggle = (key: keyof typeof notifSettings) => {
            updateState(prev => ({
              ...prev,
              notificationSettings: {
                ...(prev.notificationSettings || defaultNotificationSettings),
                [key]: !(prev.notificationSettings || defaultNotificationSettings)[key],
              },
            }));
          };

          return (
            <div className="flex flex-col gap-2.5">
              {permissionStatus === 'unsupported' && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  Seu navegador não suporta notificações.
                </div>
              )}
              {permissionStatus === 'denied' && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  Notificações bloqueadas. Habilite nas configurações do navegador.
                </div>
              )}

              <label className="flex items-center justify-between p-3 rounded-xl bg-accent border border-border cursor-pointer" onClick={() => toggle('enabled')}>
                <div className="flex items-center gap-2.5">
                  {notifSettings.enabled ? <Bell className="size-4 text-primary" strokeWidth={1.5} /> : <BellOff className="size-4 text-muted-foreground" strokeWidth={1.5} />}
                  <span className="text-sm font-medium">Ativar notificações</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${notifSettings.enabled ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${notifSettings.enabled ? 'left-5' : 'left-1'}`} />
                </div>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl bg-accent border border-border cursor-pointer transition-opacity ${!notifSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => notifSettings.enabled && toggle('dueTodayAlert')}>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📅</span>
                  <span className="text-sm">Alerta de contas vencendo hoje</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${notifSettings.dueTodayAlert ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${notifSettings.dueTodayAlert ? 'left-5' : 'left-1'}`} />
                </div>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl bg-accent border border-border cursor-pointer transition-opacity ${!notifSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => notifSettings.enabled && toggle('overdueAlert')}>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚠️</span>
                  <span className="text-sm">Alerta de contas atrasadas</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${notifSettings.overdueAlert ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${notifSettings.overdueAlert ? 'left-5' : 'left-1'}`} />
                </div>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl bg-accent border border-border cursor-pointer transition-opacity ${!notifSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => notifSettings.enabled && toggle('dueSoonAlert')}>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔔</span>
                  <span className="text-sm">Lembrete antecipado (3 dias antes)</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${notifSettings.dueSoonAlert ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${notifSettings.dueSoonAlert ? 'left-5' : 'left-1'}`} />
                </div>
              </label>
            </div>
          );
        })()}
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-start gap-2.5 mb-3">
          <Database className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Backup e limpeza</h3>
            <p className="text-muted-foreground text-sm">Seus dados são sincronizados na nuvem automaticamente</p>
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button onClick={exportBackup} className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm flex items-center gap-1.5"><Download className="size-4" strokeWidth={1.5} /> Exportar backup</button>
          <button onClick={reloadDemo} className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm flex items-center gap-1.5"><RefreshCw className="size-4" strokeWidth={1.5} /> Carregar dados demo</button>
          <button onClick={clearAll} className="badge-bad cursor-pointer px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-1.5"><AlertTriangle className="size-4" strokeWidth={1.5} /> Apagar tudo</button>
        </div>
        <div className="mt-3.5 text-[11px] text-muted-foreground opacity-70">Conta Clara v1.0 · Suas finanças, simples e seguras.</div>
      </div>
    </div>
  );
}
