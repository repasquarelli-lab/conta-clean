import { useApp } from '@/contexts/AppContext';
import { uid, categories, currency, ensureMonthFixedBills } from '@/lib/store';
import { PlusCircle, List, Save, Trash2 } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

export default function FixasView() {
  const { state, updateState, currentMonth, setCurrentMonth } = useApp();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateState(prev => {
      const next = {
        ...prev,
        fixedBills: [...prev.fixedBills, {
          id: uid(),
          name: (fd.get('name') as string).trim(),
          value: Number(fd.get('value') || 0),
          day: Number(fd.get('day') || 1),
          category: fd.get('category') as string,
        }],
      };
      return ensureMonthFixedBills(next, currentMonth);
    });
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

  return (
    <div>
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
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button type="submit" className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground">Salvar conta fixa</button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-bold">Lista de contas fixas</h3>
            <p className="text-muted-foreground text-sm">O sistema usa essa base para montar os próximos meses</p>
          </div>
          <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="px-3 py-2 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
        </div>

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
                    <button onClick={() => removeFixed(f.id)} className="badge-bad cursor-pointer text-xs font-bold">Excluir</button>
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
