import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useGoals, type Goal } from '@/hooks/useGoals';
import { currency, todayISO, monthMetrics } from '@/lib/store';
import { Target, Plus, Trash2, Pencil, X, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function MetasView() {
  const { onAuthSuccess, state, currentMonth } = useApp();
  const userId = onAuthSuccess.user?.id;
  const { goals, upsert, remove, addContribution } = useGoals(userId);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contribFor, setContribFor] = useState<Goal | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, { monthly: number; message: string }>>({});

  const surplus = monthMetrics(state, currentMonth).free;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const target_value = Number(fd.get('target_value') || 0);
    if (!name || target_value <= 0) { toast.error('Preencha nome e valor da meta.'); return; }
    upsert({
      id: editing?.id,
      name,
      target_value,
      current_value: Number(fd.get('current_value') || editing?.current_value || 0),
      deadline: String(fd.get('deadline') || '') || null,
      color: String(fd.get('color') || '#7c3aed'),
    });
    setEditing(null); setShowForm(false);
  }

  async function suggestAI(g: Goal) {
    setAiLoading(g.id);
    try {
      const { data, error } = await supabase.functions.invoke('goal-suggest', {
        body: {
          goalName: g.name,
          targetValue: g.target_value,
          currentValue: g.current_value,
          deadline: g.deadline,
          monthlySurplus: surplus,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || 'Não foi possível obter sugestão.');
      } else {
        setAiResults(prev => ({ ...prev, [g.id]: { monthly: data.monthly, message: data.message } }));
      }
    } finally { setAiLoading(null); }
  }

  function handleContrib(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!contribFor) return;
    const v = Number(new FormData(e.currentTarget).get('amount') || 0);
    if (v <= 0) { toast.error('Valor inválido'); return; }
    addContribution(contribFor.id, v);
    setContribFor(null);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Sobra estimada do mês</p>
          <p className="font-bold text-lg">{currency(surplus)}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold text-sm text-primary-foreground flex items-center gap-1.5"
        >
          <Plus className="size-4" /> Nova meta
        </button>
      </div>

      {goals.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <Target className="size-12 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-bold text-lg mb-1">Nenhuma meta cadastrada</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Crie metas como "Juntar R$ 5.000 até dezembro" e o Copiloto IA sugere quanto guardar por mês.
          </p>
          <button onClick={() => setShowForm(true)} className="brand-gradient border-none rounded-2xl px-5 py-2.5 font-bold text-sm text-primary-foreground inline-flex items-center gap-1.5">
            <Plus className="size-4" /> Criar primeira meta
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map(g => {
          const pct = g.target_value > 0 ? Math.min(100, (Number(g.current_value) / Number(g.target_value)) * 100) : 0;
          const remaining = Math.max(0, Number(g.target_value) - Number(g.current_value));
          const ai = aiResults[g.id];
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4"
              style={{ borderTop: `4px solid ${g.color || '#7c3aed'}` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl flex items-center justify-center" style={{ background: g.color || '#7c3aed' }}>
                    <Target className="size-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">{g.name}</h3>
                    {g.deadline && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" /> até {new Date(g.deadline).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(g); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-accent">
                    <Pencil className="size-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => { if (confirm('Excluir esta meta?')) remove(g.id); }} className="p-1.5 rounded-lg hover:bg-accent">
                    <Trash2 className="size-4 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{currency(Number(g.current_value))} de {currency(Number(g.target_value))}</span>
                <span className="font-semibold">{Math.round(pct)}%</span>
              </div>
              <div className="h-3 rounded-full bg-accent overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full"
                  style={{ background: g.color || '#7c3aed' }}
                />
              </div>

              {remaining > 0 && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setContribFor(g)}
                    className="flex-1 px-3 py-2 rounded-xl bg-accent border border-border text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-accent/70"
                  >
                    <TrendingUp className="size-4" /> Aporte
                  </button>
                  <button
                    onClick={() => suggestAI(g)}
                    disabled={aiLoading === g.id}
                    className="flex-1 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-sm font-semibold text-primary flex items-center justify-center gap-1.5 hover:bg-primary/20 disabled:opacity-50"
                  >
                    <Sparkles className="size-4" /> {aiLoading === g.id ? 'Pensando…' : 'Sugestão IA'}
                  </button>
                </div>
              )}

              {ai && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
                  <p className="font-bold text-primary mb-1">💡 {currency(ai.monthly)}/mês</p>
                  <p className="text-muted-foreground text-xs">{ai.message}</p>
                </motion.div>
              )}

              {remaining === 0 && (
                <p className="text-center text-sm font-bold text-primary">🎉 Meta concluída!</p>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'hsla(var(--background) / 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => { setShowForm(false); setEditing(null); }}
          >
            <motion.form
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onSubmit={handleSubmit}
              onClick={e => e.stopPropagation()}
              className="glass-panel p-5 w-full max-w-md rounded-2xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg">{editing ? 'Editar meta' : 'Nova meta'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="p-1.5 rounded-lg hover:bg-accent">
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Nome da meta *</label>
                <input name="name" defaultValue={editing?.name} placeholder="Viagem para a praia" required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Valor (R$) *</label>
                  <input name="target_value" type="number" step="0.01" defaultValue={editing?.target_value} required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Já guardado</label>
                  <input name="current_value" type="number" step="0.01" defaultValue={editing?.current_value || 0} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Prazo</label>
                <input name="deadline" type="date" defaultValue={editing?.deadline || ''} min={todayISO()} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} defaultChecked={(editing?.color || '#7c3aed') === c} className="sr-only peer" />
                      <span className="block size-8 rounded-full ring-2 ring-transparent peer-checked:ring-foreground" style={{ background: c }} />
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="brand-gradient border-none rounded-2xl px-5 py-2.5 font-bold text-sm text-primary-foreground mt-2">
                {editing ? 'Salvar' : 'Criar meta'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contribFor && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'hsla(var(--background) / 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setContribFor(null)}
          >
            <motion.form
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onSubmit={handleContrib} onClick={e => e.stopPropagation()}
              className="glass-panel p-5 w-full max-w-sm rounded-2xl flex flex-col gap-3"
            >
              <h3 className="font-bold text-lg">Aporte para "{contribFor.name}"</h3>
              <input name="amount" type="number" step="0.01" autoFocus placeholder="R$ 0,00" required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
              <button type="submit" className="brand-gradient border-none rounded-2xl px-5 py-2.5 font-bold text-sm text-primary-foreground">
                Registrar aporte
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
