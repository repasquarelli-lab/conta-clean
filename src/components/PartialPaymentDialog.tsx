import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { currency, uid, todayISO, getAllCategories, getAllIncomeCategories } from '@/lib/store';
import type { Entry } from '@/lib/store';
import { X, Save, SplitSquareHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PartialPaymentDialogProps {
  entry: Entry;
  open: boolean;
  onClose: () => void;
}

export default function PartialPaymentDialog({ entry, open, onClose }: PartialPaymentDialogProps) {
  const { state, updateState } = useApp();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  // Calculate already paid partial amounts
  const partials = state.entries.filter(e => e.partialOf === entry.id);
  const totalPartials = partials.reduce((a, b) => a + Number(b.value || 0), 0);
  const remaining = Number(entry.value || 0) - totalPartials;

  const cats = entry.type === 'income' ? getAllIncomeCategories(state) : getAllCategories(state);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(amount);
    if (val <= 0 || val > remaining) return;

    const newEntry: Entry = {
      id: uid(),
      type: entry.type,
      desc: desc.trim() || `${entry.desc} (parcial)`,
      value: val,
      date: todayISO(),
      category: entry.category,
      paid: true,
      recurring: false,
      partialOf: entry.id,
    };

    updateState(prev => {
      const entries = [...prev.entries, newEntry];
      // If total partials now cover the full amount, mark original as paid
      const newTotalPartials = totalPartials + val;
      if (newTotalPartials >= Number(entry.value || 0)) {
        return { ...prev, entries: entries.map(en => en.id === entry.id ? { ...en, paid: true } : en) };
      }
      return { ...prev, entries };
    });

    setAmount('');
    setDesc('');
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'hsla(var(--background) / 0.8)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel p-5 w-full max-w-md rounded-2xl shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <SplitSquareHorizontal className="size-5 text-primary" strokeWidth={1.5} />
                {entry.type === 'income' ? 'Recebimento parcial' : 'Pagamento parcial'}
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            {/* Entry info */}
            <div className="p-3 rounded-xl bg-accent border border-border mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold">{entry.desc}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.type === 'income' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                  {entry.type === 'income' ? 'Receita' : 'Despesa'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Valor total</p>
                  <p className="text-sm font-bold">{currency(entry.value)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Já {entry.type === 'income' ? 'recebido' : 'pago'}</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{currency(totalPartials)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Restante</p>
                  <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{currency(remaining)}</p>
                </div>
              </div>
              {/* Partial history */}
              {partials.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">Lançamentos parciais:</p>
                  {partials.map(p => (
                    <div key={p.id} className="flex justify-between text-xs py-0.5">
                      <span className="truncate">{p.desc}</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{currency(p.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {remaining > 0 ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Valor {entry.type === 'income' ? 'recebido' : 'pago'} agora
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={`Máx: ${currency(remaining)}`}
                    required
                    className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Descrição (opcional)</label>
                  <input
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder={`${entry.desc} (parcial)`}
                    className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center justify-center gap-1.5 mt-1"
                >
                  <Save className="size-4" strokeWidth={1.5} />
                  Registrar {entry.type === 'income' ? 'recebimento' : 'pagamento'}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-center">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  ✅ Valor totalmente {entry.type === 'income' ? 'recebido' : 'pago'}!
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
