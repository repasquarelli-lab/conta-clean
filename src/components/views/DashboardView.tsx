import { useApp } from '@/contexts/AppContext';
import { currency, monthMetrics, paidCount, upcomingBills, dueTodayBills, overdueBills, topCategory, formatDate, ensureMonthFixedBills } from '@/lib/store';
import BillItem from '../BillItem';

export default function DashboardView() {
  const { state, currentMonth, updateState } = useApp();
  
  // Ensure fixed bills
  ensureMonthFixedBills(state, currentMonth);

  const m = monthMetrics(state, currentMonth);
  const counts = paidCount(state, currentMonth);
  const next = upcomingBills(state, 7);
  const today = dueTodayBills(state);
  const overdue = overdueBills(state);
  const top = topCategory(state, currentMonth);
  const fixedPct = m.incomes ? Math.round((m.fixedExpenses / m.incomes) * 100) : 0;
  const progressPct = counts.total ? Math.round((counts.paid / counts.total) * 100) : 0;
  const savingsTone = m.balance >= 0 ? 'Seu mês está positivo até aqui.' : 'Seu mês precisa de atenção.';

  return (
    <div>
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Entrou no mês', value: currency(m.incomes), sub: 'Receitas registradas' },
          { label: 'Saiu no mês', value: currency(m.expenses), sub: 'Todas as despesas do mês' },
          { label: 'Em aberto', value: currency(m.open), sub: 'Contas ainda não pagas' },
          { label: 'Saldo do mês', value: currency(m.balance), sub: savingsTone },
          { label: 'Vence hoje', value: String(today.length), sub: 'Contas com vencimento hoje' },
        ].map(metric => (
          <div key={metric.label} className="glass-panel p-4">
            <h3 className="text-muted-foreground text-sm mb-1.5">{metric.label}</h3>
            <p className="text-2xl font-extrabold">{metric.value}</p>
            <div className="text-xs text-muted-foreground mt-1">{metric.sub}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-4 mt-4">
        {/* Upcoming bills */}
        <div className="glass-panel p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-bold">Próximas contas</h3>
              <p className="text-muted-foreground text-sm">O que precisa de atenção agora</p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {today.map(e => <BillItem key={e.id} entry={e} label="Hoje" variant="bad" />)}
            {next.filter(e => e.delta > 0).slice(0, 5).map(e => (
              <BillItem key={e.id} entry={e} label={e.delta === 1 ? 'Amanhã' : `Em ${e.delta} dias`} variant="warn" />
            ))}
            {today.length === 0 && next.filter(e => e.delta > 0).length === 0 && (
              <div className="p-4 rounded-2xl border border-dashed border-border text-muted-foreground text-center text-sm">
                Nenhuma conta próxima. Seu mês está mais tranquilo.
              </div>
            )}
          </div>
        </div>

        {/* Quick status */}
        <div className="glass-panel p-4">
          <div className="mb-3">
            <h3 className="font-bold">Situação rápida</h3>
            <p className="text-muted-foreground text-sm">Leitura simples do seu mês</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm">
              <strong>{counts.paid}/{counts.total}</strong><br />contas pagas
              <div className="progress-bar mt-2">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm">
              <strong>{fixedPct}%</strong><br />da renda vai para contas fixas
            </div>
            <div className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm">
              <strong>{top ? top[0] : '—'}</strong><br />maior categoria do mês
            </div>
            <div className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm">
              <strong>{overdue.length}</strong><br />contas atrasadas
            </div>
          </div>
          <div className="mt-3.5 text-xs text-muted-foreground">Resumo pensado para uso leigo: rápido de entender e com foco no cotidiano.</div>
        </div>
      </div>
    </div>
  );
}
