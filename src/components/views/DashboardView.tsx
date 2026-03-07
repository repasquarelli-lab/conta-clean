import { useApp } from '@/contexts/AppContext';
import { currency, monthMetrics, paidCount, upcomingBills, dueTodayBills, overdueBills, topCategory, getMonthEntries, ensureMonthFixedBills } from '@/lib/store';
import BillItem from '../BillItem';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import MonthNavigator from '../MonthNavigator';
import MarketTicker from '../MarketTicker';

const CHART_COLORS = [
  'hsl(190, 90%, 50%)',
  'hsl(260, 70%, 60%)',
  'hsl(340, 75%, 55%)',
  'hsl(45, 90%, 55%)',
  'hsl(160, 70%, 45%)',
  'hsl(20, 85%, 55%)',
  'hsl(290, 60%, 50%)',
  'hsl(120, 55%, 45%)',
  'hsl(210, 80%, 55%)',
];

function getCategoryData(state: any, month: string) {
  const entries = getMonthEntries(state, month).filter(e => e.type === 'expense');
  const map: Record<string, number> = {};
  entries.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.value || 0); });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-panel px-3 py-2 rounded-xl text-xs">
      <p className="font-bold">{d.name}</p>
      <p>{currency(d.value)}</p>
    </div>
  );
};

export default function DashboardView() {
  const { state, currentMonth, setCurrentMonth } = useApp();
  
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

  const categoryData = getCategoryData(state, currentMonth);
  const totalExpenses = categoryData.reduce((a, b) => a + b.value, 0);

  return (
    <div>
      {/* Month Navigator */}
      <div className="mb-4 flex justify-center sm:justify-start">
        <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
      </div>

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

      {/* Charts */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Pie Chart */}
          <div className="glass-panel p-4">
            <div className="mb-3">
              <h3 className="font-bold">Gastos por categoria</h3>
              <p className="text-muted-foreground text-sm">Onde seu dinheiro está indo</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1.5 w-full sm:w-1/2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1 truncate">{cat.name}</span>
                    <span className="text-muted-foreground text-xs">{Math.round((cat.value / totalExpenses) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="glass-panel p-4">
            <div className="mb-3">
              <h3 className="font-bold">Comparativo por categoria</h3>
              <p className="text-muted-foreground text-sm">Valores absolutos dos gastos</p>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 20%)" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fill: 'hsl(220, 15%, 55%)', fontSize: 11 }} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(220, 15%, 75%)', fontSize: 11 }} width={90} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220, 20%, 15%)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
