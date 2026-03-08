import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getMonthEntries, currency, formatDate, todayISO, uid, categories, incomeCategories } from '@/lib/store';
import MonthNavigator from '../MonthNavigator';
import { PlusCircle, List, Search, Check, Undo2, Trash2, ArrowDownCircle, ArrowUpCircle, Save } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

export default function LancamentosView() {
  const { state, updateState, currentMonth, setCurrentMonth } = useApp();
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const entries = getMonthEntries(state, currentMonth).sort((a, b) => a.date.localeCompare(b.date));
  const cats = entryType === 'income' ? incomeCategories : categories;

  const filtered = entries.filter(e => {
    const okText = !search || e.desc.toLowerCase().includes(search.toLowerCase());
    const okType = filterType === 'all' || e.type === filterType;
    return okText && okType;
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

  return (
    <div>
      <div className="glass-panel p-4 mb-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-bold">Novo lançamento</h3>
            <p className="text-muted-foreground text-sm">Cadastre uma entrada ou saída em poucos campos</p>
          </div>
          <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setEntryType('income')} className={`px-3 py-2.5 rounded-xl border text-sm cursor-pointer ${entryType === 'income' ? 'brand-gradient border-transparent text-primary-foreground font-bold' : 'bg-card border-border'}`}>
            Receita
          </button>
          <button onClick={() => setEntryType('expense')} className={`px-3 py-2.5 rounded-xl border text-sm cursor-pointer ${entryType === 'expense' ? 'brand-gradient border-transparent text-primary-foreground font-bold' : 'bg-card border-border'}`}>
            Despesa
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
              <label className="text-xs font-medium mb-1 block">Data</label>
              <input name="date" type="date" defaultValue={todayISO()} required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
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
            <button type="submit" className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground">Salvar lançamento</button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-4">
        <h3 className="font-bold mb-3">Lançamentos do mês</h3>
        <div className="flex gap-2.5 flex-wrap mb-3">
          <input placeholder="Buscar por descrição..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[160px] px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none placeholder:text-muted-foreground" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="min-w-[160px] px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none">
            <option value="all">Todos</option>
            <option value="income">Só receitas</option>
            <option value="expense">Só despesas</option>
          </select>
        </div>

        <div className="overflow-auto border border-border rounded-2xl">
          <table className="w-full border-collapse min-w-[760px]" style={{ background: 'hsl(var(--accent))' }}>
            <thead>
              <tr>
                {['Tipo', 'Descrição', 'Categoria', 'Data', 'Valor', 'Situação', 'Ações'].map(h => (
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
                      <button onClick={() => togglePaid(e.id)} className={`${e.paid ? 'badge-warn' : 'badge-good'} cursor-pointer text-xs font-bold`}>
                        {e.paid ? 'Marcar pendente' : 'Marcar pago'}
                      </button>
                      <button onClick={() => removeEntry(e.id)} className="badge-bad cursor-pointer text-xs font-bold">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
