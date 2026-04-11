import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getMonthEntries, currency, formatDate, todayISO, uid, getAllCategories, getAllIncomeCategories, Entry } from '@/lib/store';
import MonthNavigator from '../MonthNavigator';
import PartialPaymentDialog from '../PartialPaymentDialog';
import { PlusCircle, List, LayoutGrid, Search, Check, Undo2, Trash2, ArrowDownCircle, ArrowUpCircle, Save, Pencil, X, CreditCard, TrendingUp, TrendingDown, SplitSquareHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { motion, AnimatePresence } from 'framer-motion';

export default function LancamentosView() {
  const { state, updateState, currentMonth, setCurrentMonth } = useApp();
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [installments, setInstallments] = useState(1);
  const [partialEntry, setPartialEntry] = useState<Entry | null>(null);
  const [expandedPartials, setExpandedPartials] = useState<Set<string>>(new Set());

  const entries = getMonthEntries(state, currentMonth).sort((a, b) => a.date.localeCompare(b.date));
  const expenseCats = getAllCategories(state);
  const incomeCats = getAllIncomeCategories(state);
  const cats = entryType === 'income' ? incomeCats : expenseCats;

  const tabEntries = entries.filter(e => e && e.type === activeTab && !e.partialOf);
  const allMonthCategories = [...new Set(tabEntries.map(e => e.category))].sort();

  const filtered = tabEntries.filter(e => {
    const okText = !search || e.desc.toLowerCase().includes(search.toLowerCase());
    const okCat = filterCategory === 'all' || e.category === filterCategory;
    const okStatus = filterStatus === 'all' || (filterStatus === 'paid' ? e.paid : !e.paid);
    return okText && okCat && okStatus;
  });

  function getPartials(entryId: string) {
    return state.entries.filter(e => e && e.partialOf === entryId);
  }

  function toggleExpandPartials(id: string) {
    setExpandedPartials(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalIncome = entries.filter(e => e.type === 'income').reduce((a, b) => a + Number(b.value || 0), 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((a, b) => a + Number(b.value || 0), 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const desc = (fd.get('desc') as string).trim();
    const totalValue = Number(fd.get('value') || 0);
    const date = fd.get('date') as string;
    const category = fd.get('category') as string;
    const recurring = fd.get('recurring') === 'true';
    const paid = fd.get('paid') === 'true';

    if (installments > 1 && entryType === 'expense') {
      const groupId = uid();
      const parcelValue = Math.round((totalValue / installments) * 100) / 100;
      const [y, m, d] = date.split('-').map(Number);

      updateState(prev => {
        const newEntries = [...prev.entries];
        for (let i = 0; i < installments; i++) {
          const installDate = new Date(y, m - 1 + i, d);
          const dateStr = `${installDate.getFullYear()}-${String(installDate.getMonth() + 1).padStart(2, '0')}-${String(installDate.getDate()).padStart(2, '0')}`;
          newEntries.push({
            id: uid(),
            type: entryType,
            desc: `${desc} (${i + 1}/${installments})`,
            value: parcelValue,
            date: dateStr,
            category,
            recurring,
            paid: i === 0 ? paid : false,
            installments,
            installmentNumber: i + 1,
            installmentGroup: groupId,
          });
        }
        return { ...prev, entries: newEntries };
      });
    } else {
      updateState(prev => ({
        ...prev,
        entries: [...prev.entries, {
          id: uid(),
          type: entryType,
          desc,
          value: totalValue,
          date,
          category,
          recurring,
          paid,
        }],
      }));
    }
    setInstallments(1);
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 border-l-4"
          style={{ borderLeftColor: 'hsl(142, 71%, 45%)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
            <span className="text-xs font-medium text-muted-foreground">Total Entradas</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{currency(totalIncome)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{entries.filter(e => e.type === 'income').length} receitas no mês</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-4 border-l-4"
          style={{ borderLeftColor: 'hsl(0, 72%, 51%)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="size-4 text-red-500 dark:text-red-400" strokeWidth={1.5} />
            <span className="text-xs font-medium text-muted-foreground">Total Saídas</span>
          </div>
          <p className="text-xl font-extrabold text-red-500 dark:text-red-400">{currency(totalExpense)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{entries.filter(e => e.type === 'expense').length} despesas no mês</p>
        </motion.div>
      </div>

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
              <label className="text-xs font-medium mb-1 block">Valor {installments > 1 ? '(total)' : ''}</label>
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
            {entryType === 'expense' && (
              <div>
                <label className="text-xs font-medium mb-1 block flex items-center gap-1.5">
                  <CreditCard className="size-3.5" strokeWidth={1.5} /> Parcelar?
                </label>
                <select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
                  <option value={1}>À vista</option>
                  {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n}x parcelas</option>
                  ))}
                </select>
                {installments > 1 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    💡 Cada parcela será distribuída automaticamente nos próximos meses
                  </p>
                )}
              </div>
            )}
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

      {/* Entries list with tabs */}
      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <h3 className="font-bold flex items-center gap-2">
            <List className="size-5 text-muted-foreground" strokeWidth={1.5} />
            Lançamentos do mês
          </h3>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 bg-accent rounded-xl p-1 border border-border">
              <button onClick={() => setActiveTab('income')} className={`px-3 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-all flex items-center gap-1 ${activeTab === 'income' ? 'bg-emerald-500/15 shadow-sm text-emerald-700 dark:text-emerald-400 font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                <TrendingUp className="size-3" /> Entradas
              </button>
              <button onClick={() => setActiveTab('expense')} className={`px-3 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-all flex items-center gap-1 ${activeTab === 'expense' ? 'bg-red-500/15 shadow-sm text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                <TrendingDown className="size-3" /> Saídas
              </button>
            </div>
            <div className="flex gap-1 bg-accent rounded-xl p-1 border border-border">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Lista">
                <List className="size-4" strokeWidth={1.5} />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Quadro">
                <LayoutGrid className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          <div className="flex-1 min-w-[160px] relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
            <input placeholder="Buscar por descrição..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="min-w-[120px] px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
            <option value="all">Todas categorias</option>
            {allMonthCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="min-w-[110px] px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
            <option value="all">Qualquer status</option>
            <option value="paid">{activeTab === 'income' ? 'Recebidos' : 'Pagos'}</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>

        {viewMode === 'list' ? (
          <>
            {/* Desktop table */}
            <div className="overflow-auto border border-border rounded-2xl hidden sm:block">
              <table className="w-full border-collapse min-w-[660px]" style={{ background: 'hsl(var(--accent))' }}>
                <thead>
                  <tr>
                    {['Descrição', 'Categoria', activeTab === 'income' ? 'Recebimento' : 'Vencimento', 'Valor', 'Situação', 'Ações'].map(h => (
                      <th key={h} className="p-3 border-b border-border text-left text-sm font-bold text-muted-foreground" style={{ background: 'hsla(220,40%,95%,0.02)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground text-sm border-b border-border">Nenhum lançamento encontrado.</td></tr>
                  ) : filtered.map(e => {
                    const partials = getPartials(e.id);
                    const totalPartials = partials.reduce((a, b) => a + Number(b.value || 0), 0);
                    const hasPartials = partials.length > 0;
                    const isExpanded = expandedPartials.has(e.id);
                    return (
                      <React.Fragment key={e.id}>
                        <tr className="hover:bg-accent/50">
                          <td className="p-3 border-b border-border text-sm">
                            <div className="flex items-center gap-1.5">
                              {e.desc}
                              {e.installments && e.installments > 1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                  {e.installmentNumber}/{e.installments}
                                </span>
                              )}
                              {hasPartials && (
                                <button onClick={() => toggleExpandPartials(e.id)} className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors">
                                  <SplitSquareHorizontal className="size-3" />
                                  {partials.length} {partials.length === 1 ? 'parcial' : 'parciais'}
                                  {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                </button>
                              )}
                            </div>
                            {hasPartials && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {currency(totalPartials)} de {currency(e.value)} {e.type === 'income' ? 'recebido' : 'pago'}
                              </div>
                            )}
                          </td>
                          <td className="p-3 border-b border-border text-sm">{e.category}</td>
                          <td className="p-3 border-b border-border text-sm">{formatDate(e.date)}</td>
                          <td className="p-3 border-b border-border text-sm font-semibold">
                            <span className={activeTab === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
                              {activeTab === 'income' ? '+' : '-'} {currency(e.value)}
                            </span>
                          </td>
                          <td className="p-3 border-b border-border text-sm">
                            <span className={e.paid ? 'badge-good' : 'badge-warn'}>
                              {e.type === 'income' ? (e.paid ? 'Recebido' : 'Pendente') : (e.paid ? 'Pago' : 'Pendente')}
                            </span>
                          </td>
                          <td className="p-3 border-b border-border text-sm">
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => setPartialEntry(e)} className="badge-warn cursor-pointer text-xs font-bold flex items-center gap-1" title={e.type === 'income' ? 'Recebimento parcial' : 'Pagamento parcial'}>
                                <SplitSquareHorizontal className="size-3" /> Parcial
                              </button>
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
                        {/* Partial payments sub-rows */}
                        {isExpanded && partials.map(p => (
                          <tr key={p.id} className="bg-primary/5">
                            <td className="p-2 pl-8 border-b border-border text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <SplitSquareHorizontal className="size-3 text-primary" />
                                {p.desc}
                              </div>
                            </td>
                            <td className="p-2 border-b border-border text-xs text-muted-foreground">{p.category}</td>
                            <td className="p-2 border-b border-border text-xs text-muted-foreground">{formatDate(p.date)}</td>
                            <td className="p-2 border-b border-border text-xs font-medium">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +{currency(p.value)}
                              </span>
                            </td>
                            <td className="p-2 border-b border-border text-xs">
                              <span className="badge-good">Confirmado</span>
                            </td>
                            <td className="p-2 border-b border-border text-xs">
                              <button onClick={() => removeEntry(p.id)} className="badge-bad cursor-pointer text-[11px] font-bold flex items-center gap-1">
                                <Trash2 className="size-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
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
                const partials = getPartials(e.id);
                const totalPartials = partials.reduce((a, b) => a + Number(b.value || 0), 0);
                const hasPartials = partials.length > 0;
                const isExpanded = expandedPartials.has(e.id);
                return (
                  <div key={e.id} className="p-3 rounded-2xl bg-accent border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl grid place-items-center bg-card border border-border shrink-0">
                          <CatIcon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{e.desc}</p>
                          <p className="text-[11px] text-muted-foreground">{e.category} · {formatDate(e.date)}</p>
                        </div>
                      </div>
                      <span className={e.paid ? 'badge-good' : 'badge-warn'}>
                        {e.type === 'income' ? (e.paid ? 'Recebido' : 'Pendente') : (e.paid ? 'Pago' : 'Pendente')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-sm font-bold ${e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {e.type === 'income' ? '+' : '-'} {currency(e.value)}
                        </span>
                        {hasPartials && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({currency(totalPartials)} {e.type === 'income' ? 'recebido' : 'pago'})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setPartialEntry(e)} className="badge-warn cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform" title={e.type === 'income' ? 'Recebimento parcial' : 'Pagamento parcial'}>
                          <SplitSquareHorizontal className="size-3" />
                        </button>
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
                    {/* Partial payments history */}
                    {hasPartials && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <button onClick={() => toggleExpandPartials(e.id)} className="flex items-center gap-1 text-[10px] font-bold text-primary cursor-pointer mb-1">
                          <SplitSquareHorizontal className="size-3" />
                          {partials.length} {partials.length === 1 ? 'lançamento parcial' : 'lançamentos parciais'}
                          {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </button>
                        {isExpanded && partials.map(p => (
                          <div key={p.id} className="flex justify-between items-center text-[11px] py-1 pl-2 border-l-2 border-primary/30 mb-1">
                            <div>
                              <span className="text-muted-foreground">{p.desc}</span>
                              <span className="text-muted-foreground ml-1">· {formatDate(p.date)}</span>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{currency(p.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                      <p className="text-[11px] text-muted-foreground mt-0.5">📅 {formatDate(e.date)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setPartialEntry(e)} className="badge-warn cursor-pointer text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform" title={e.type === 'income' ? 'Recebimento parcial' : 'Pagamento parcial'}>
                        <SplitSquareHorizontal className="size-3" />
                      </button>
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

      {/* Partial Payment Dialog */}
      <PartialPaymentDialog
        entry={partialEntry!}
        open={!!partialEntry}
        onClose={() => setPartialEntry(null)}
      />
    </div>
  );
}
