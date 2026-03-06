import { useApp } from '@/contexts/AppContext';
import { monthMetrics, paidCount, topCategory, currency } from '@/lib/store';

export default function ResumoView() {
  const { state, currentMonth, setCurrentMonth } = useApp();

  const m = monthMetrics(state, currentMonth);
  const counts = paidCount(state, currentMonth);
  const top = topCategory(state, currentMonth);
  const fixedPct = m.incomes ? Math.round((m.fixedExpenses / m.incomes) * 100) : 0;
  const openPct = m.incomes ? Math.round((m.open / m.incomes) * 100) : 0;

  const insights = [
    `Você já pagou ${counts.paid} de ${counts.total} contas registradas neste mês.`,
    `Suas contas fixas consomem ${fixedPct}% da sua renda do mês.`,
    ...(top ? [`A categoria com maior peso no mês foi ${top[0]}, com ${currency(top[1])}.`] : []),
    `Ainda existem ${currency(m.open)} em contas pendentes.`,
    m.balance >= 0 ? `O mês está positivo em ${currency(m.balance)}.` : `O mês está negativo em ${currency(Math.abs(m.balance))}.`,
    openPct > 30 ? 'Atenção: o valor ainda em aberto está alto para este mês.' : 'O valor em aberto está dentro de uma faixa mais controlada.',
  ];

  return (
    <div>
      <div className="glass-panel p-4 mb-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-bold">Leitura simples do mês</h3>
            <p className="text-muted-foreground text-sm">Resumo em linguagem humana</p>
          </div>
          <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="px-3 py-2 rounded-[14px] border border-border bg-input text-foreground text-sm outline-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((text, i) => (
            <div key={i} className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm">{text}</div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <h3 className="font-bold mb-1">Distribuição rápida</h3>
        <p className="text-muted-foreground text-sm mb-3">Quanto entrou, quanto saiu e quanto ainda está pendente</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Entradas', value: currency(m.incomes) },
            { label: 'Saídas', value: currency(m.expenses) },
            { label: 'Em aberto', value: currency(m.open) },
            { label: 'Sobra estimada', value: currency(m.free) },
          ].map(item => (
            <div key={item.label} className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm">
              <strong>{item.value}</strong><br />{item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
