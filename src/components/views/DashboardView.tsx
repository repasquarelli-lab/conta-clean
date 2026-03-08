import { useApp } from '@/contexts/AppContext';
import { currency, monthMetrics, paidCount, upcomingBills, dueTodayBills, overdueBills, topCategory, getMonthEntries, ensureMonthFixedBills, AppState, budgetProgress } from '@/lib/store';
import BillItem from '../BillItem';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend } from 'recharts';
import MonthNavigator from '../MonthNavigator';
import MarketTicker from '../MarketTicker';
import AiTipsWidget from '../AiTipsWidget';
import { TrendingUp, TrendingDown, Clock, Wallet, AlertCircle, PieChart as PieChartIcon, BarChart3, LineChart, Target, CalendarClock, Activity, CheckCircle2, Percent, ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

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

function getPrevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_LABELS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_LABELS[m - 1]}/${y}`;
}

function getMonthComparison(state: AppState, month: string) {
  const prev = getPrevMonth(month);
  const cur = monthMetrics(state, month);
  const prv = monthMetrics(state, prev);
  
  const curCatMap: Record<string, number> = {};
  const prvCatMap: Record<string, number> = {};
  getMonthEntries(state, month).filter(e => e.type === 'expense').forEach(e => {
    curCatMap[e.category] = (curCatMap[e.category] || 0) + Number(e.value || 0);
  });
  getMonthEntries(state, prev).filter(e => e.type === 'expense').forEach(e => {
    prvCatMap[e.category] = (prvCatMap[e.category] || 0) + Number(e.value || 0);
  });

  const allCats = [...new Set([...Object.keys(curCatMap), ...Object.keys(prvCatMap)])];
  const categories = allCats.map(cat => {
    const curVal = curCatMap[cat] || 0;
    const prvVal = prvCatMap[cat] || 0;
    const diff = curVal - prvVal;
    const pct = prvVal > 0 ? Math.round(((curVal - prvVal) / prvVal) * 100) : curVal > 0 ? 100 : 0;
    const status = prvVal === 0 && curVal > 0 ? 'NOVO' : curVal === 0 && prvVal > 0 ? 'ZEROU' : null;
    return { cat, curVal, prvVal, diff, pct, status };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  return {
    cur, prv, prev,
    incomeDiff: cur.incomes - prv.incomes,
    expenseDiff: cur.expenses - prv.expenses,
    balanceDiff: cur.balance - prv.balance,
    categories,
  };
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
  const comparison = getMonthComparison(state, currentMonth);
  const prevMonthStr = getPrevMonth(currentMonth);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Market Ticker */}
      <motion.div className="mb-4" variants={fadeUp} transition={{ duration: 0.4 }}>
        <MarketTicker />
      </motion.div>

      {/* Month Navigator */}
      <motion.div className="mb-4 flex justify-center sm:justify-start" variants={fadeUp} transition={{ duration: 0.4 }}>
        <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
      </motion.div>

      {/* Metrics */}
      <motion.div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5" variants={staggerContainer}>
        {([
          { label: 'Entrou no mês', value: currency(m.incomes), sub: 'Receitas registradas', icon: TrendingUp, accent: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Saiu no mês', value: currency(m.expenses), sub: 'Despesas do mês', icon: TrendingDown, accent: 'text-red-500 dark:text-red-400' },
          { label: 'Em aberto', value: currency(m.open), sub: 'Contas não pagas', icon: AlertCircle, accent: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Saldo do mês', value: currency(m.balance), sub: savingsTone, icon: Wallet, accent: m.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
          { label: 'Vence hoje', value: String(today.length), sub: 'Contas com vencimento hoje', icon: Clock, accent: today.length > 0 ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground' },
        ] as { label: string; value: string; sub: string; icon: LucideIcon; accent: string }[]).map((metric, idx) => (
          <motion.div key={metric.label} className={`glass-panel p-3 sm:p-4 transition-all hover:border-primary/15 ${idx === 4 ? 'col-span-2 md:col-span-1' : ''}`} variants={fadeUp} transition={{ duration: 0.35 }}>
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl grid place-items-center bg-accent border border-border">
                <metric.icon className={`size-3.5 sm:size-4 shrink-0 ${metric.accent}`} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold tracking-tight leading-tight">{metric.value}</p>
            <h3 className="text-muted-foreground text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1">{metric.label}</h3>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      {categoryData.length > 0 && (
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4" variants={staggerContainer}>
          {/* Pie Chart */}
          <motion.div className="glass-panel p-3 sm:p-4" variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="mb-2 sm:mb-3 flex items-start gap-2">
              <PieChartIcon className="size-4 sm:size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold text-sm sm:text-base">Gastos por categoria</h3>
                <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Onde seu dinheiro está indo</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="w-full sm:w-1/2 h-[160px] sm:h-[200px]">
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
          </motion.div>

          {/* Bar Chart */}
          <motion.div className="glass-panel p-3 sm:p-4" variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="mb-2 sm:mb-3 flex items-start gap-2">
              <BarChart3 className="size-4 sm:size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold text-sm sm:text-base">Comparativo por categoria</h3>
                <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Valores absolutos dos gastos</p>
              </div>
            </div>
            <div className="h-[180px] sm:h-[220px]">
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
          </motion.div>
        </motion.div>
      )}

      {/* Evolution Chart - 6 months */}
      <motion.div className="glass-panel p-3 sm:p-4 mt-3 sm:mt-4" variants={fadeUp} transition={{ duration: 0.5 }}>
        <div className="mb-2 sm:mb-3 flex items-start gap-2">
          <LineChart className="size-4 sm:size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold text-sm sm:text-base">Evolução mensal</h3>
            <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Receitas × Despesas dos últimos 6 meses</p>
          </div>
        </div>
        <div className="h-[200px] sm:h-[260px]">
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
      </motion.div>

      {/* Month Comparison */}
      {(comparison.categories.length > 0 || comparison.prv.expenses > 0) && (
        <motion.div className="glass-panel p-3 sm:p-4 mt-3 sm:mt-4" variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="mb-2 sm:mb-3 flex items-start gap-2">
            <ArrowUpRight className="size-4 sm:size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Comparação com mês anterior</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">{monthLabel(currentMonth)} vs {monthLabel(prevMonthStr)}</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {([
              { label: 'Receitas', cur: comparison.cur.incomes, prev: comparison.prv.incomes, diff: comparison.incomeDiff, positive: true },
              { label: 'Despesas', cur: comparison.cur.expenses, prev: comparison.prv.expenses, diff: comparison.expenseDiff, positive: false },
              { label: 'Saldo', cur: comparison.cur.balance, prev: comparison.prv.balance, diff: comparison.balanceDiff, positive: true },
            ]).map(item => {
              const isGood = item.positive ? item.diff >= 0 : item.diff <= 0;
              const pct = item.prev !== 0 ? Math.round(Math.abs(item.diff / item.prev) * 100) : item.diff !== 0 ? 100 : 0;
              return (
                <div key={item.label} className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-accent border border-border text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{item.label}</p>
                  <p className="font-bold text-xs sm:text-sm">{currency(item.cur)}</p>
                  <div className={`flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-semibold ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {item.diff > 0 ? <ArrowUpRight className="size-3" /> : item.diff < 0 ? <ArrowDownRight className="size-3" /> : <Minus className="size-3" />}
                    <span>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category breakdown */}
          <div className="flex flex-col gap-2">
            {comparison.categories.slice(0, 5).map(c => {
              const CatIcon = getCategoryIcon(c.cat);
              const increased = c.diff > 0;
              const decreased = c.diff < 0;
              return (
                <div key={c.cat} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-accent/50 border border-border/50">
                  <CatIcon className="size-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-medium flex-1 truncate">{c.cat}</span>
                  {c.status && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.status === 'NOVO' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {c.status}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{currency(c.curVal)}</span>
                  <div className={`flex items-center gap-0.5 text-xs font-semibold min-w-[50px] justify-end ${increased ? 'text-red-500 dark:text-red-400' : decreased ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    {increased ? <ArrowUpRight className="size-3" /> : decreased ? <ArrowDownRight className="size-3" /> : <Minus className="size-3" />}
                    <span>{c.status ? '—' : `${Math.abs(c.pct)}%`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Budget Goals */}
      {(state.budgetGoals?.length ?? 0) > 0 && (
        <motion.div className="glass-panel p-3 sm:p-4 mt-3 sm:mt-4" variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="mb-2 sm:mb-3 flex items-start gap-2">
            <Target className="size-4 sm:size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Metas de orçamento</h3>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Acompanhe seus limites por categoria</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
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
        </motion.div>
      )}

      {/* AI Copilot */}
      <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
        <AiTipsWidget />
      </motion.div>

      {/* Two columns */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-3 sm:gap-4 mt-3 sm:mt-4" variants={staggerContainer}>
        {/* Upcoming bills */}
        <motion.div className="glass-panel p-3 sm:p-4" variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <div className="flex items-start gap-2">
              <CalendarClock className="size-4 sm:size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold text-sm sm:text-base">Próximas contas</h3>
                <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">O que precisa de atenção agora</p>
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
        </motion.div>

        {/* Quick status */}
        <motion.div className="glass-panel p-3 sm:p-4" variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="mb-2 sm:mb-3 flex items-start gap-2">
            <Activity className="size-4 sm:size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Situação rápida</h3>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Leitura simples do seu mês</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
              <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <strong>{overdue.length}</strong><br />contas atrasadas
              </div>
            </div>
            {/* Mini donut chart */}
            <div className="col-span-2 p-3.5 rounded-[18px] bg-accent border border-border">
              <div className="flex items-center gap-2 mb-2">
                <PieChartIcon className="size-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-semibold">Despesas por categoria</span>
              </div>
              {categoryData.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-[90px] h-[90px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={2}
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
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    {categoryData.slice(0, 4).map((cat, i) => {
                      const CatIcon = getCategoryIcon(cat.name);
                      return (
                        <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <CatIcon className="size-3 text-muted-foreground shrink-0" strokeWidth={1.5} />
                          <span className="truncate flex-1">{cat.name}</span>
                          <span className="text-muted-foreground font-medium">{Math.round((cat.value / totalExpenses) * 100)}%</span>
                        </div>
                      );
                    })}
                    {categoryData.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">+{categoryData.length - 4} mais</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">Sem despesas registradas</p>
              )}
            </div>
          </div>
          <div className="mt-3.5 text-[11px] text-muted-foreground text-center opacity-70">Atualizado com base nos seus lançamentos deste mês.</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
