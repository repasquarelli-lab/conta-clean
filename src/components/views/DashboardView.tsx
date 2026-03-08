import { useApp } from '@/contexts/AppContext';
import { currency, monthMetrics, paidCount, upcomingBills, dueTodayBills, overdueBills, topCategory, getMonthEntries, ensureMonthFixedBills, AppState, budgetProgress } from '@/lib/store';
import BillItem from '../BillItem';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend } from 'recharts';
import MonthNavigator from '../MonthNavigator';
import MarketTicker from '../MarketTicker';
import AiTipsWidget from '../AiTipsWidget';
import { TrendingUp, TrendingDown, Clock, Wallet, AlertCircle, PieChart as PieChartIcon, BarChart3, LineChart, Target, CalendarClock, Activity, CheckCircle2, Percent, FolderOpen, type LucideIcon } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

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

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getEvolutionData(state: AppState, currentMonth: string, count: number = 6) {
  const [y, m] = currentMonth.split('-').map(Number);
  const data: { month: string; receitas: number; despesas: number; saldo: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const metrics = monthMetrics(state, key);
    data.push({
      month: `${MONTH_NAMES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      receitas: metrics.incomes,
      despesas: metrics.expenses,
      saldo: metrics.balance,
    });
  }
  return data;
}

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
  const evolutionData = getEvolutionData(state, currentMonth);

  return (
    <div>
      {/* Market Ticker */}
      <div className="mb-4">
        <MarketTicker />
      </div>

      {/* Month Navigator */}
      <div className="mb-4 flex justify-center sm:justify-start">
        <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {([
          { label: 'Entrou no mês', value: currency(m.incomes), sub: 'Receitas registradas', icon: TrendingUp },
          { label: 'Saiu no mês', value: currency(m.expenses), sub: 'Todas as despesas do mês', icon: TrendingDown },
          { label: 'Em aberto', value: currency(m.open), sub: 'Contas ainda não pagas', icon: AlertCircle },
          { label: 'Saldo do mês', value: currency(m.balance), sub: savingsTone, icon: Wallet },
          { label: 'Vence hoje', value: String(today.length), sub: 'Contas com vencimento hoje', icon: Clock },
        ] as { label: string; value: string; sub: string; icon: LucideIcon }[]).map(metric => (
          <div key={metric.label} className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <metric.icon className="size-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <h3 className="text-muted-foreground text-sm">{metric.label}</h3>
            </div>
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
            <div className="mb-3 flex items-start gap-2.5">
              <PieChartIcon className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold">Gastos por categoria</h3>
                <p className="text-muted-foreground text-sm">Onde seu dinheiro está indo</p>
              </div>
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
                {categoryData.map((cat, i) => {
                  const CatIcon = getCategoryIcon(cat.name);
                  return (
                    <div key={cat.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <CatIcon className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <span className="flex-1 truncate">{cat.name}</span>
                      <span className="text-muted-foreground text-xs">{Math.round((cat.value / totalExpenses) * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="glass-panel p-4">
            <div className="mb-3 flex items-start gap-2.5">
              <BarChart3 className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold">Comparativo por categoria</h3>
                <p className="text-muted-foreground text-sm">Valores absolutos dos gastos</p>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} width={90} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
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

      {/* Evolution Chart - 6 months */}
      <div className="glass-panel p-4 mt-4">
        <div className="mb-3 flex items-start gap-2.5">
          <LineChart className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Evolução mensal</h3>
            <p className="text-muted-foreground text-sm">Receitas × Despesas dos últimos 6 meses</p>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
              <Tooltip
                formatter={(value: number, name: string) => [currency(value), name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Saldo']}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend
                formatter={(value) => value === 'receitas' ? 'Receitas' : value === 'despesas' ? 'Despesas' : 'Saldo'}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="receitas" stroke="hsl(142, 71%, 45%)" fill="url(#gradReceitas)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(142, 71%, 45%)' }} />
              <Area type="monotone" dataKey="despesas" stroke="hsl(0, 72%, 51%)" fill="url(#gradDespesas)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(0, 72%, 51%)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Goals */}
      {(state.budgetGoals?.length ?? 0) > 0 && (
        <div className="glass-panel p-4 mt-4">
          <div className="mb-3 flex items-start gap-2.5">
            <Target className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold">Metas de orçamento</h3>
              <p className="text-muted-foreground text-sm">Acompanhe seus limites por categoria</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {budgetProgress(state, currentMonth).map(g => {
              const overBudget = g.pct > 100;
              const nearLimit = g.pct >= 80 && g.pct <= 100;
              return (
                <div key={g.category} className="p-3.5 rounded-2xl bg-accent border border-border">
                  <div className="flex justify-between items-center mb-1.5">
                    {(() => { const CatIcon = getCategoryIcon(g.category); return <CatIcon className="size-4 text-muted-foreground shrink-0" strokeWidth={1.5} />; })()}
                    <span className="text-sm font-semibold flex-1 ml-2">{g.category}</span>
                    <span className={`text-xs font-bold ${overBudget ? 'text-red-600 dark:text-red-400' : nearLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {g.pct}%
                    </span>
                  </div>
                  <div className="progress-bar mb-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(g.pct, 100)}%`,
                        background: overBudget
                          ? 'hsl(0, 72%, 51%)'
                          : nearLimit
                          ? 'hsl(38, 92%, 50%)'
                          : 'hsl(142, 71%, 45%)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{currency(g.spent)} gasto</span>
                    <span>de {currency(g.limit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Copilot */}
      <AiTipsWidget />

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-4 mt-4">
        {/* Upcoming bills */}
        <div className="glass-panel p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-start gap-2.5">
              <CalendarClock className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold">Próximas contas</h3>
                <p className="text-muted-foreground text-sm">O que precisa de atenção agora</p>
              </div>
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
          <div className="mb-3 flex items-start gap-2.5">
            <Activity className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold">Situação rápida</h3>
              <p className="text-muted-foreground text-sm">Leitura simples do seu mês</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm flex items-start gap-2">
              <CheckCircle2 className="size-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <strong>{counts.paid}/{counts.total}</strong><br />contas pagas
                <div className="progress-bar mt-2">
                  <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
            <div className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm flex items-start gap-2">
              <Percent className="size-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <strong>{fixedPct}%</strong><br />da renda vai para contas fixas
              </div>
            </div>
            <div className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm flex items-start gap-2">
              <FolderOpen className="size-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <strong>{top ? top[0] : '—'}</strong><br />maior categoria do mês
              </div>
            </div>
            <div className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm flex items-start gap-2">
              <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <strong>{overdue.length}</strong><br />contas atrasadas
              </div>
            </div>
          </div>
          <div className="mt-3.5 text-xs text-muted-foreground">Resumo pensado para uso leigo: rápido de entender e com foco no cotidiano.</div>
        </div>
      </div>
    </div>
  );
}
