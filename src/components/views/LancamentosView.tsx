import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getMonthEntries, currency, formatDate, todayISO, uid, getAllCategories, getAllIncomeCategories, Entry } from '@/lib/store';
import MonthNavigator from '../MonthNavigator';
import { PlusCircle, List, LayoutGrid, Search, Check, Undo2, Trash2, ArrowDownCircle, ArrowUpCircle, Save, Pencil, X } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { motion, AnimatePresence } from 'framer-motion';

export default function LancamentosView() {
  const { state, updateState, currentMonth, setCurrentMonth } = useApp();
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const entries = getMonthEntries(state, currentMonth).sort((a, b) => a.date.localeCompare(b.date));
  const expenseCats = getAllCategories(state);
  const incomeCats = getAllIncomeCategories(state);
  const cats = entryType === 'income' ? incomeCats : expenseCats;

  const allMonthCategories = [...new Set(entries.map(e => e.category))].sort();

  const filtered = entries.filter(e => {
    const okText = !search || e.desc.toLowerCase().includes(search.toLowerCase());
    const okType = filterType === 'all' || e.type === filterType;
    const okCat = filterCategory === 'all' || e.category === filterCategory;
    const okStatus = filterStatus === 'all' || (filterStatus === 'paid' ? e.paid : !e.paid);
    return okText && okType && okCat && okStatus;
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateState(prev => ({
      ...prev,
      entries: [...prev.entries, {
        id: uid(),
        type: entryType,
        desc: (fd.get('desc') as string).trim(),
        value: Number(fd.get('value') || 0),
        date: fd.get('date') as string,
        category: fd.get('category') as string,
        recurring: fd.get('recurring') === 'true',
        paid: fd.get('paid') === 'true',
      }],
    }));
    e.currentTarget.reset();
  }

  function togglePaid(id: string) {
    updateState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, paid: !e.paid } : e),
    }));
  }

  function removeEntry(id: string) {
    updateState(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }));
  }

  function startEdit(entry: Entry) {
    setEditingEntry({ ...entry });
  }

  function saveEdit() {
    if (!editingEntry) return;
    updateState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === editingEntry.id ? editingEntry : e),
    }));
    setEditingEntry(null);
  }

  const editCats = editingEntry
    ? (editingEntry.type === 'income' ? incomeCats : expenseCats)
    : [];

  return (
    <div>
      {/* Edit Modal */}
      <AnimatePresence>
        {editingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'hsla(var(--background) / 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setEditingEntry(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-5 w-full max-w-md rounded-2xl shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Editar lançamento</h3>
                <button onClick={() => setEditingEntry(null)} className="p-1.5 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Tipo</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingEntry({ ...editingEntry, type: 'income' })} className={`flex-1 px-3 py-2.5 rounded-xl border text-sm cursor-pointer flex items-center justify-center gap-1.5 ${editingEntry.type === 'income' ? 'brand-gradient border-transparent text-primary-foreground font-bold' : 'bg-card border-border'}`}>
                      <ArrowDownCircle className="size-4" strokeWidth={1.5} /> Receita
                    </button>
                    <button type="button" onClick={() => setEditingEntry({ ...editingEntry, type: 'expense' })} className={`flex-1 px-3 py-2.5 rounded-xl border text-sm cursor-pointer flex items-center justify-center gap-1.5 ${editingEntry.type === 'expense' ? 'brand-gradient border-transparent text-primary-foreground font-bold' : 'bg-card border-border'}`}>
                      <ArrowUpCircle className="size-4" strokeWidth={1.5} /> Despesa
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Descrição</label>
                  <input value={editingEntry.desc} onChange={e => setEditingEntry({ ...editingEntry, desc: e.target.value })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Valor</label>
                    <input type="number" step="0.01" min="0" value={editingEntry.value} onChange={e => setEditingEntry({ ...editingEntry, value: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Data</label>
                    <input type="date" value={editingEntry.date} onChange={e => setEditingEntry({ ...editingEntry, date: e.target.value })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Categoria</label>
                    <select value={editingEntry.category} onChange={e => setEditingEntry({ ...editingEntry, category: e.target.value })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
                      {editCats.map(c => <option key={c} value={c}>{c}</option>)}
                      {!editCats.includes(editingEntry.category) && <option value={editingEntry.category}>{editingEntry.category}</option>}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Status</label>
                    <select value={editingEntry.paid ? 'true' : 'false'} onChange={e => setEditingEntry({ ...editingEntry, paid: e.target.value === 'true' })} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
                      <option value="true">{editingEntry.type === 'income' ? 'Recebido' : 'Pago'}</option>
                      <option value="false">Pendente</option>
                    </select>
                  </div>
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
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="flex items-start gap-2.5">
            <PlusCircle className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold">Novo lançamento</h3>
              <p className="text-muted-foreground text-sm">Cadastre uma entrada ou saída em poucos campos</p>
            </div>
          </div>
          <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setEntryType('income')} className={`px-3 py-2.5 rounded-xl border text-sm cursor-pointer flex items-center gap-1.5 ${entryType === 'income' ? 'brand-gradient border-transparent text-primary-foreground font-bold' : 'bg-card border-border'}`}>
            <ArrowDownCircle className="size-4" strokeWidth={1.5} /> Receita
          </button>
          <button onClick={() => setEntryType('expense')} className={`px-3 py-2.5 rounded-xl border text-sm cursor-pointer flex items-center gap-1.5 ${entryType === 'expense' ? 'brand-gradient border-transparent text-primary-foreground font-bold' : 'bg-card border-border'}`}>
            <ArrowUpCircle className="size-4" strokeWidth={1.5} /> Despesa
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Descrição</label>
              <input name="desc" placeholder="Ex.: Mercado do mês" required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Valor</label>
              <input name="value" type="number" step="0.01" min="0" placeholder="0,00" required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">
                {entryType === 'income' ? '📅 Data do recebimento' : '📅 Data de vencimento'}
              </label>
              <input name="date" type="date" defaultValue={todayISO()} required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
              <p className="text-[11px] text-muted-foreground mt-1">
                {entryType === 'income' ? 'Quando você espera receber este valor' : 'Quando esta conta vence — usada nos alertas da agenda'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Categoria</label>
              <select name="category" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Repetir todo mês?</label>
              <select name="recurring" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Já foi pago/recebido?</label>
              <select name="paid" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button type="submit" className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5"><Save className="size-4" strokeWidth={1.5} /> Salvar lançamento</button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <h3 className="font-bold flex items-center gap-2">
            <List className="size-5 text-muted-foreground" strokeWidth={1.5} />
            Lançamentos do mês
          </h3>
          <div className="flex gap-1 bg-accent rounded-xl p-1 border border-border">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Visualização em lista">
              <List className="size-4" strokeWidth={1.5} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Visualização em quadro">
              <LayoutGrid className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          <div className="flex-1 min-w-[160px] relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
            <input placeholder="Buscar por descrição..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="min-w-[120px] px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
            <option value="all">Todos os tipos</option>
            <option value="income">Só receitas</option>
            <option value="expense">Só despesas</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="min-w-[120px] px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
            <option value="all">Todas categorias</option>
            {allMonthCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="min-w-[110px] px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
            <option value="all">Qualquer status</option>
            <option value="paid">Pagos/Recebidos</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>

        {viewMode === 'list' ? (
          <>
            {/* Desktop table */}
            <div className="overflow-auto border border-border rounded-2xl hidden sm:block">
              <table className="w-full border-collapse min-w-[760px]" style={{ background: 'hsl(var(--accent))' }}>
                <thead>
                  <tr>
                    {['Tipo', 'Descrição', 'Categoria', 'Venc./Receb.', 'Valor', 'Situação', 'Ações'].map(h => (
                      <th key={h} className="p-3 border-b border-border text-left text-sm font-bold text-muted-foreground" style={{ background: 'hsla(220,40%,95%,0.02)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground text-sm border-b border-border">Nenhum lançamento encontrado.</td></tr>
                  ) : filtered.map(e => (
                    <tr key={e.id} className="hover:bg-accent/50">
                      <td className="p-3 border-b border-border text-sm">{e.type === 'income' ? 'Receita' : 'Despesa'}</td>
                      <td className="p-3 border-b border-border text-sm">{e.desc}</td>
                      <td className="p-3 border-b border-border text-sm">{e.category}</td>
                      <td className="p-3 border-b border-border text-sm">{formatDate(e.date)}</td>
                      <td className="p-3 border-b border-border text-sm">{currency(e.value)}</td>
                      <td className="p-3 border-b border-border text-sm">
                        <span className={e.paid ? 'badge-good' : 'badge-warn'}>
                          {e.type === 'income' ? (e.paid ? 'Recebido' : 'Pendente') : (e.paid ? 'Pago' : 'Pendente')}
                        </span>
                      </td>
                      <td className="p-3 border-b border-border text-sm">
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => startEdit(e)} className="badge-good cursor-pointer text-xs font-bold flex items-center gap-1">
                            <Pencil className="size-3" /> Editar
                          </button>
                          <button onClick={() => togglePaid(e.id)} className={`${e.paid ? 'badge-warn' : 'badge-good'} cursor-pointer text-xs font-bold flex items-center gap-1`}>
                            {e.paid ? <><Undo2 className="size-3" /> Pendente</> : <><Check className="size-3" /> Pago</>}
                          </button>
                          <button onClick={() => removeEntry(e.id)} className="badge-bad cursor-pointer text-xs font-bold flex items-center gap-1">
                            <Trash2 className="size-3" /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="flex flex-col gap-2 sm:hidden">
              {filtered.length === 0 ? (
                <div className="p-5 rounded-2xl border border-dashed border-border text-muted-foreground text-center text-sm">
                  Nenhum lançamento encontrado.
                </div>
              ) : filtered.map(e => {
                const CatIcon = getCategoryIcon(e.category);
                return (
                  <div key={e.id} className="p-3 rounded-2xl bg-accent border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl grid place-items-center bg-card border border-border shrink-0">
                          <CatIcon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{e.desc}</p>
                          <p className="text-[11px] text-muted-foreground">{e.category} · {e.type === 'income' ? 'Receb.' : 'Venc.'} {formatDate(e.date)}</p>
                        </div>
                      </div>
                      <span className={e.paid ? 'badge-good' : 'badge-warn'}>
                        {e.type === 'income' ? (e.paid ? 'Recebido' : 'Pendente') : (e.paid ? 'Pago' : 'Pendente')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                        {e.type === 'income' ? '+' : '-'} {currency(e.value)}
                      </span>
                      <div className="flex gap-1.5">
                        <button onClick={() => startEdit(e)} className="badge-good cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform">
                          <Pencil className="size-3" />
                        </button>
                        <button onClick={() => togglePaid(e.id)} className={`${e.paid ? 'badge-warn' : 'badge-good'} cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform`}>
                          {e.paid ? <Undo2 className="size-3" /> : <Check className="size-3" />}
                        </button>
                        <button onClick={() => removeEntry(e.id)} className="badge-bad cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Grid / Card view */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.length === 0 ? (
              <div className="col-span-full p-5 rounded-2xl border border-dashed border-border text-muted-foreground text-center text-sm">
                Nenhum lançamento encontrado.
              </div>
            ) : filtered.map(e => {
              const CatIcon = getCategoryIcon(e.category);
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-accent border border-border flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl grid place-items-center border border-border shrink-0 ${e.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <CatIcon className={`size-4 ${e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{e.desc}</p>
                        <p className="text-[11px] text-muted-foreground">{e.category}</p>
                      </div>
                    </div>
                    <span className={e.paid ? 'badge-good' : 'badge-warn'}>
                      {e.type === 'income' ? (e.paid ? 'Recebido' : 'Pendente') : (e.paid ? 'Pago' : 'Pendente')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <span className={`text-lg font-black ${e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {e.type === 'income' ? '+' : '-'} {currency(e.value)}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{e.type === 'income' ? '📅 Receb.' : '📅 Venc.'} {formatDate(e.date)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(e)} className="badge-good cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => togglePaid(e.id)} className={`${e.paid ? 'badge-warn' : 'badge-good'} cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform`}>
                        {e.paid ? <Undo2 className="size-3" /> : <Check className="size-3" />}
                      </button>
                      <button onClick={() => removeEntry(e.id)} className="badge-bad cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
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
