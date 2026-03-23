import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { uid, getAllCategories, currency, ensureMonthFixedBills, FixedBill } from '@/lib/store';
import { PlusCircle, List, LayoutGrid, Save, Trash2, CalendarDays, Pencil, X, CreditCard } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { motion, AnimatePresence } from 'framer-motion';

export default function FixasView() {
  const { state, updateState, currentMonth, setCurrentMonth } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingBill, setEditingBill] = useState<FixedBill | null>(null);
  const [installments, setInstallments] = useState(1);
  const cats = getAllCategories(state);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string).trim();
    const value = Number(fd.get('value') || 0);
    const day = Number(fd.get('day') || 1);
    const category = fd.get('category') as string;

    if (installments > 1) {
      // Parcelamento: create a fixed bill AND generate installment entries
      const groupId = uid();
      const [y, m] = currentMonth.split('-').map(Number);
      const parcelValue = Math.round((value / installments) * 100) / 100;

      updateState(prev => {
        const newEntries = [...prev.entries];
        for (let i = 0; i < installments; i++) {
          const installDate = new Date(y, m - 1 + i, Math.min(day, 28));
          const dateStr = `${installDate.getFullYear()}-${String(installDate.getMonth() + 1).padStart(2, '0')}-${String(installDate.getDate()).padStart(2, '0')}`;
          newEntries.push({
            id: uid(),
            type: 'expense',
            desc: `${name} (${i + 1}/${installments})`,
            value: parcelValue,
            date: dateStr,
            category,
            recurring: false,
            paid: false,
            sourceFixed: false,
            installments,
            installmentNumber: i + 1,
            installmentGroup: groupId,
          });
        }
        return { ...prev, entries: newEntries };
      });
    } else {
      updateState(prev => {
        const next = {
          ...prev,
          fixedBills: [...prev.fixedBills, {
            id: uid(),
            name,
            value,
            day,
            category,
          }],
        };
        return ensureMonthFixedBills(next, currentMonth);
      });
    }
    setInstallments(1);
    e.currentTarget.reset();
  }

  function removeFixed(id: string) {
    updateState(prev => {
      const bill = prev.fixedBills.find(f => f.id === id);
      return {
        ...prev,
        fixedBills: prev.fixedBills.filter(f => f.id !== id),
        entries: prev.entries.filter(e => !(e.sourceFixed && bill && e.desc === bill.name)),
      };
    });
  }

  function startEdit(bill: FixedBill) {
    setEditingBill({ ...bill });
  }

  function saveEdit() {
    if (!editingBill) return;
    updateState(prev => {
      const oldBill = prev.fixedBills.find(f => f.id === editingBill.id);
      return {
        ...prev,
        fixedBills: prev.fixedBills.map(f => f.id === editingBill.id ? editingBill : f),
        // Update related entries
        entries: prev.entries.map(e => {
          if (e.sourceFixed && oldBill && e.desc === oldBill.name) {
            return { ...e, desc: editingBill.name, value: editingBill.value, category: editingBill.category };
          }
          return e;
        }),
      };
    });
    setEditingBill(null);
  }

  return (
    <div>
      {/* Edit Modal */}
      <AnimatePresence>
        {editingBill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'hsla(var(--background) / 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setEditingBill(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-5 w-full max-w-md rounded-2xl shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Editar conta fixa</h3>
                <button onClick={() => setEditingBill(null)} className="p-1.5 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Nome</label>
                  <input value={editingBill.name} onChange={e => setEditingBill({ ...editingBill, name: e.target.value })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Valor</label>
                    <input type="number" step="0.01" min="0" value={editingBill.value} onChange={e => setEditingBill({ ...editingBill, value: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Dia do vencimento</label>
                    <input type="number" min="1" max="28" value={editingBill.day} onChange={e => setEditingBill({ ...editingBill, day: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Categoria</label>
                  <select value={editingBill.category} onChange={e => setEditingBill({ ...editingBill, category: e.target.value })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                    {!cats.includes(editingBill.category) && <option value={editingBill.category}>{editingBill.category}</option>}
                  </select>
                </div>
                <button onClick={saveEdit} className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center justify-center gap-1.5 mt-1">
                  <Save className="size-4" strokeWidth={1.5} /> Salvar alterações
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel p-4 mb-4">
        <div className="flex items-start gap-2.5 mb-1">
          <PlusCircle className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Nova conta fixa</h3>
            <p className="text-muted-foreground text-sm mb-3">Cadastre uma vez e use todo mês</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Nome</label>
              <input name="name" placeholder="Ex.: Energia" required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Valor</label>
              <input name="value" type="number" step="0.01" min="0" required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Dia do vencimento</label>
              <input name="day" type="number" min="1" max="28" required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Categoria</label>
              <select name="category" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block flex items-center gap-1.5">
              <CreditCard className="size-3.5" strokeWidth={1.5} /> Parcelar?
            </label>
            <select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
              <option value={1}>Não (conta fixa mensal)</option>
              {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <option key={n} value={n}>{n}x parcelas (não recorrente)</option>
              ))}
            </select>
            {installments > 1 && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                💡 Serão criados {installments} lançamentos distribuídos nos próximos meses
              </p>
            )}
          </div>
          </div>
          <div className="mt-3">
            <button type="submit" className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5"><Save className="size-4" strokeWidth={1.5} /> {installments > 1 ? 'Criar parcelas' : 'Salvar conta fixa'}</button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="flex items-start gap-2.5">
            <List className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold">Lista de contas fixas</h3>
              <p className="text-muted-foreground text-sm">O sistema usa essa base para montar os próximos meses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-accent rounded-xl p-1 border border-border">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Lista">
                <List className="size-4" strokeWidth={1.5} />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Quadro">
                <LayoutGrid className="size-4" strokeWidth={1.5} />
              </button>
            </div>
            <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="px-3 py-2 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-auto border border-border rounded-2xl">
            <table className="w-full border-collapse" style={{ background: 'hsl(var(--accent))' }}>
              <thead>
                <tr>
                  {['Conta', 'Categoria', 'Dia', 'Valor', 'Ações'].map(h => (
                    <th key={h} className="p-3 border-b border-border text-left text-sm font-bold text-muted-foreground" style={{ background: 'hsla(220,40%,95%,0.02)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.fixedBills.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-sm">Nenhuma conta fixa cadastrada.</td></tr>
                ) : state.fixedBills.map(f => (
                  <tr key={f.id} className="hover:bg-accent/50">
                    <td className="p-3 border-b border-border text-sm">{f.name}</td>
                    <td className="p-3 border-b border-border text-sm">{f.category}</td>
                    <td className="p-3 border-b border-border text-sm">Dia {f.day}</td>
                    <td className="p-3 border-b border-border text-sm">{currency(f.value)}</td>
                    <td className="p-3 border-b border-border text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(f)} className="badge-good cursor-pointer text-xs font-bold flex items-center gap-1">
                          <Pencil className="size-3" /> Editar
                        </button>
                        <button onClick={() => removeFixed(f.id)} className="badge-bad cursor-pointer text-xs font-bold flex items-center gap-1"><Trash2 className="size-3" /> Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.fixedBills.length === 0 ? (
              <div className="col-span-full p-5 rounded-2xl border border-dashed border-border text-muted-foreground text-center text-sm">
                Nenhuma conta fixa cadastrada.
              </div>
            ) : state.fixedBills.map(f => {
              const CatIcon = getCategoryIcon(f.category);
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-accent border border-border flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl grid place-items-center bg-card border border-border shrink-0">
                      <CatIcon className="size-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">{f.category}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => startEdit(f)} className="badge-good cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => removeFixed(f.id)} className="badge-bad cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform shrink-0">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-lg font-black text-foreground">{currency(f.value)}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="size-3" strokeWidth={1.5} /> Dia {f.day}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
