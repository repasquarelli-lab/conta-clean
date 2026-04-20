import { useApp } from '@/contexts/AppContext';
import { useState } from 'react';
import { monthMetrics, paidCount, topCategory, currency, budgetProgress, getMonthEntries, AppState } from '@/lib/store';
import MonthNavigator from '../MonthNavigator';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, ShieldCheck, ArrowUpRight, ArrowDownRight, Minus, DollarSign, CreditCard, HelpCircle, PiggyBank, BarChart3, LineChart as LineChartIcon, HeartPulse } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend } from 'recharts';

function generateTips(state: any, month: string) {
  const m = monthMetrics(state, month);
  const counts = paidCount(state, month);
  const top = topCategory(state, month);
  const budgets = budgetProgress(state, month);
  const fixedPct = m.incomes ? Math.round((m.fixedExpenses / m.incomes) * 100) : 0;
  const entries = getMonthEntries(state, month).filter(e => e.type === 'expense');

  const tips: { icon: typeof Lightbulb; color: string; title: string; text: string }[] = [];

  // Balance tip
  if (m.balance >= 0) {
    tips.push({
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      title: 'Mês positivo',
      text: `Você está com saldo de ${currency(m.balance)}. Continue assim! Se possível, guarde esse valor como reserva.`,
    });
  } else {
    tips.push({
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      title: 'Mês no vermelho',
      text: `Suas despesas superaram a renda em ${currency(Math.abs(m.balance))}. Revise gastos variáveis para equilibrar o mês.`,
    });
  }

  // Fixed expenses tip
  if (fixedPct > 70) {
    tips.push({
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      title: 'Contas fixas pesando',
      text: `${fixedPct}% da sua renda vai para contas fixas. O ideal é manter abaixo de 60%. Tente renegociar algum contrato.`,
    });
  } else if (fixedPct > 0) {
    tips.push({
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      title: 'Fixas sob controle',
      text: `Suas contas fixas representam ${fixedPct}% da renda — dentro de uma faixa saudável.`,
    });
  }

  // Top category insight
  if (top) {
    const topPct = m.expenses > 0 ? Math.round((top[1] / m.expenses) * 100) : 0;
    if (topPct > 40) {
      tips.push({
        icon: Target,
        color: 'text-yellow-600 dark:text-yellow-400',
        title: `${top[0]} domina seus gastos`,
        text: `A categoria "${top[0]}" representa ${topPct}% de todas as despesas (${currency(top[1])}). Avalie se há como reduzir.`,
      });
    } else {
      tips.push({
        icon: Target,
        color: 'text-primary',
        title: `Maior gasto: ${top[0]}`,
        text: `Sua principal categoria de gasto é "${top[0]}" com ${currency(top[1])} (${topPct}% do total). Distribuição saudável.`,
      });
    }
  }

  // Budget goals tips
  const exceeded = budgets.filter(b => b.pct > 100);
  const nearLimit = budgets.filter(b => b.pct >= 80 && b.pct <= 100);
  const underControl = budgets.filter(b => b.pct < 50);

  if (exceeded.length > 0) {
    tips.push({
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      title: `${exceeded.length} meta${exceeded.length > 1 ? 's' : ''} estourada${exceeded.length > 1 ? 's' : ''}`,
      text: exceeded.map(b => `"${b.category}" passou ${b.pct - 100}% do limite (${currency(b.spent)} de ${currency(b.limit)})`).join('. ') + '. Revise esses gastos com atenção.',
    });
  }

  if (nearLimit.length > 0) {
    tips.push({
      icon: Lightbulb,
      color: 'text-yellow-600 dark:text-yellow-400',
      title: `${nearLimit.length} meta${nearLimit.length > 1 ? 's' : ''} quase no limite`,
      text: nearLimit.map(b => `"${b.category}" está em ${b.pct}%`).join(', ') + '. Cuidado para não ultrapassar até o fim do mês.',
    });
  }

  if (underControl.length > 0 && exceeded.length === 0) {
    tips.push({
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      title: 'Orçamento sob controle',
      text: `${underControl.length} categoria${underControl.length > 1 ? 's' : ''} está abaixo de 50% do limite — ótima disciplina financeira!`,
    });
  }

  // Payment progress tip
  if (counts.total > 0) {
    const paidPct = Math.round((counts.paid / counts.total) * 100);
    if (paidPct === 100) {
      tips.push({
        icon: CheckCircle,
        color: 'text-emerald-600 dark:text-emerald-400',
        title: 'Tudo pago!',
        text: 'Todas as contas do mês estão quitadas. Parabéns pela organização!',
      });
    } else if (paidPct < 50) {
      tips.push({
        icon: Lightbulb,
        color: 'text-primary',
        title: 'Contas pendentes',
        text: `Você pagou ${counts.paid} de ${counts.total} contas (${paidPct}%). Fique de olho nos vencimentos para evitar atrasos.`,
      });
    }
  }

  // Discretionary spending tip
  const discretionary = entries.filter(e => !e.recurring).reduce((a, b) => a + Number(b.value || 0), 0);
  const discretionaryPct = m.expenses > 0 ? Math.round((discretionary / m.expenses) * 100) : 0;
  if (discretionary > 0) {
    tips.push({
      icon: Lightbulb,
      color: 'text-primary',
      title: 'Gastos variáveis',
      text: discretionaryPct > 40
        ? `${currency(discretionary)} em gastos variáveis (${discretionaryPct}% das despesas). Esses são os mais fáceis de cortar se precisar economizar.`
        : `Apenas ${currency(discretionary)} em gastos variáveis (${discretionaryPct}%). Seus gastos são majoritariamente fixos e previsíveis.`,
    });
  }

  return tips;
}

function getPrevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getCategoryComparison(state: AppState, month: string) {
  const prev = getPrevMonth(month);
  const curEntries = getMonthEntries(state, month).filter(e => e.type === 'expense');
  const prevEntries = getMonthEntries(state, prev).filter(e => e.type === 'expense');

  const curMap: Record<string, number> = {};
  const prevMap: Record<string, number> = {};
  curEntries.forEach(e => { curMap[e.category] = (curMap[e.category] || 0) + Number(e.value || 0); });
  prevEntries.forEach(e => { prevMap[e.category] = (prevMap[e.category] || 0) + Number(e.value || 0); });

  const allCats = new Set([...Object.keys(curMap), ...Object.keys(prevMap)]);
  return Array.from(allCats)
    .map(cat => {
      const cur = curMap[cat] || 0;
      const prv = prevMap[cat] || 0;
      const diff = cur - prv;
      const pct = prv > 0 ? Math.round(((cur - prv) / prv) * 100) : cur > 0 ? 100 : 0;
      return { category: cat, current: cur, previous: prv, diff, pct };
    })
    .filter(c => c.current > 0 || c.previous > 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_LABELS[m - 1]}/${String(y).slice(2)}`;
}

const BAR_COLORS = [
  'hsl(262, 83%, 58%)', 'hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(280, 65%, 60%)',
  'hsl(174, 72%, 46%)', 'hsl(45, 93%, 47%)', 'hsl(210, 40%, 55%)',
];

function getCategoryData(state: AppState, month: string) {
  const entries = getMonthEntries(state, month).filter(e => e.type === 'expense');
  const map: Record<string, number> = {};
  entries.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.value || 0); });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

function getMonthlyEvolution(state: AppState, currentMonth: string, periodMonths: number) {
  const [curY, curM] = currentMonth.split('-').map(Number);
  const months: { month: string; label: string; receitas: number; despesas: number }[] = [];
  for (let i = periodMonths - 1; i >= 0; i--) {
    const d = new Date(curY, curM - 1 - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const metrics = monthMetrics(state, m);
    months.push({
      month: m,
      label: monthLabel(m),
      receitas: Math.round(metrics.incomes * 100) / 100,
      despesas: Math.round(metrics.expenses * 100) / 100,
    });
  }
  return months;
}

function getFinancialHealth(state: AppState, month: string) {
  const m = monthMetrics(state, month);
  const counts = paidCount(state, month);
  const budgets = budgetProgress(state, month);

  let score = 0;
  const breakdown: { label: string; value: number; max: number; status: 'good' | 'warn' | 'bad' }[] = [];

  // 1. Saldo positivo + taxa de economia (0-40 pts)
  const savingsRate = m.incomes > 0 ? (m.balance / m.incomes) * 100 : 0;
  let savingsPts = 0;
  let savingsStatus: 'good' | 'warn' | 'bad' = 'bad';
  if (savingsRate >= 20) { savingsPts = 40; savingsStatus = 'good'; }
  else if (savingsRate >= 10) { savingsPts = 30; savingsStatus = 'good'; }
  else if (savingsRate >= 0) { savingsPts = 20; savingsStatus = 'warn'; }
  else if (savingsRate >= -10) { savingsPts = 10; savingsStatus = 'bad'; }
  score += savingsPts;
  breakdown.push({ label: `Taxa de economia: ${savingsRate.toFixed(0)}%`, value: savingsPts, max: 40, status: savingsStatus });

  // 2. Contas fixas vs renda (0-25 pts)
  const fixedPct = m.incomes > 0 ? (m.fixedExpenses / m.incomes) * 100 : 100;
  let fixedPts = 0;
  let fixedStatus: 'good' | 'warn' | 'bad' = 'bad';
  if (fixedPct <= 50) { fixedPts = 25; fixedStatus = 'good'; }
  else if (fixedPct <= 70) { fixedPts = 15; fixedStatus = 'warn'; }
  else if (fixedPct <= 90) { fixedPts = 8; fixedStatus = 'bad'; }
  score += fixedPts;
  breakdown.push({ label: `Contas fixas: ${fixedPct.toFixed(0)}% da renda`, value: fixedPts, max: 25, status: fixedStatus });

  // 3. Metas de orçamento (0-20 pts)
  let budgetPts = 20;
  let budgetStatus: 'good' | 'warn' | 'bad' = 'good';
  let budgetLabel = 'Sem metas definidas';
  if (budgets.length > 0) {
    const exceeded = budgets.filter(b => b.pct > 100).length;
    const nearLimit = budgets.filter(b => b.pct >= 80 && b.pct <= 100).length;
    if (exceeded > 0) {
      budgetPts = Math.max(0, 20 - exceeded * 8);
      budgetStatus = 'bad';
      budgetLabel = `${exceeded} meta(s) estourada(s)`;
    } else if (nearLimit > 0) {
      budgetPts = 12;
      budgetStatus = 'warn';
      budgetLabel = `${nearLimit} meta(s) no limite`;
    } else {
      budgetLabel = 'Todas as metas em dia';
    }
  } else {
    budgetPts = 10;
    budgetStatus = 'warn';
  }
  score += budgetPts;
  breakdown.push({ label: budgetLabel, value: budgetPts, max: 20, status: budgetStatus });

  // 4. Disciplina de pagamento (0-15 pts)
  const totalBills = counts.total;
  const paidBills = counts.paid;
  const payRate = totalBills > 0 ? (paidBills / totalBills) * 100 : 100;
  let payPts = 0;
  let payStatus: 'good' | 'warn' | 'bad' = 'bad';
  if (payRate >= 90) { payPts = 15; payStatus = 'good'; }
  else if (payRate >= 70) { payPts = 10; payStatus = 'warn'; }
  else if (payRate >= 50) { payPts = 6; payStatus = 'warn'; }
  else { payPts = 2; payStatus = 'bad'; }
  score += payPts;
  breakdown.push({ label: `Contas pagas: ${paidBills}/${totalBills} (${payRate.toFixed(0)}%)`, value: payPts, max: 15, status: payStatus });

  score = Math.min(100, Math.max(0, Math.round(score)));

  let level: { label: string; color: string; bg: string; ring: string };
  if (score >= 80) level = { label: 'Excelente', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30' };
  else if (score >= 60) level = { label: 'Boa', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', ring: 'ring-sky-500/30' };
  else if (score >= 40) level = { label: 'Atenção', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/30' };
  else level = { label: 'Crítica', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/30' };

  return { score, level, breakdown };
}

export default function ResumoView() {
  const { state, currentMonth, setCurrentMonth } = useApp();
  const [evolutionPeriod, setEvolutionPeriod] = useState<3 | 6 | 12>(6);

  const m = monthMetrics(state, currentMonth);
  const counts = paidCount(state, currentMonth);
  const tips = generateTips(state, currentMonth);
  const comparison = getCategoryComparison(state, currentMonth);
  const prevMonthStr = getPrevMonth(currentMonth);
  const categoryData = getCategoryData(state, currentMonth);
  const evolutionData = getMonthlyEvolution(state, currentMonth, evolutionPeriod);
  const health = getFinancialHealth(state, currentMonth);

  return (
    <div>
      {/* Smart Tips */}
      <div className="glass-panel p-4 mb-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warning" />
              Dicas inteligentes
            </h3>
            <p className="text-muted-foreground text-sm">Análise personalizada do seu mês</p>
          </div>
          <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tips.map((tip, i) => (
            <div key={i} className="p-4 rounded-2xl bg-accent border border-border flex gap-3 items-start">
              <tip.icon className={`w-5 h-5 shrink-0 mt-0.5 ${tip.color}`} />
              <div>
                <strong className="text-sm block mb-0.5">{tip.title}</strong>
                <span className="text-muted-foreground text-sm leading-relaxed">{tip.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Health Score */}
      <div className="glass-panel p-4 mb-4">
        <div className="mb-3 flex items-start gap-2.5">
          <HeartPulse className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Saúde financeira</h3>
            <p className="text-muted-foreground text-sm">Score baseado em economia, contas fixas, metas e disciplina</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
          <div className={`flex flex-col items-center justify-center rounded-2xl p-5 ${health.level.bg} ring-1 ${health.level.ring} shrink-0 w-full sm:w-40`}>
            <div className={`text-5xl font-extrabold tabular-nums ${health.level.color}`}>{health.score}</div>
            <div className="text-xs text-muted-foreground mt-1">de 100</div>
            <div className={`mt-2 text-sm font-bold ${health.level.color}`}>{health.level.label}</div>
          </div>
          <div className="flex-1 flex flex-col gap-2 w-full">
            {health.breakdown.map((b, i) => {
              const pct = b.max > 0 ? (b.value / b.max) * 100 : 0;
              const barColor = b.status === 'good' ? 'bg-emerald-500' : b.status === 'warn' ? 'bg-yellow-500' : 'bg-red-500';
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/90 font-medium truncate pr-2">{b.label}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0">{b.value}/{b.max}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-accent overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {categoryData.length > 0 && (
        <div className="glass-panel p-4 mb-4">
          <div className="mb-3 flex items-start gap-2.5">
            <BarChart3 className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold">Despesas por categoria</h3>
              <p className="text-muted-foreground text-sm">Visualize onde seu dinheiro está indo neste mês</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <XAxis type="number" tickFormatter={(v: number) => `R$${v}`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [currency(value), 'Gasto']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '13px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  cursor={{ fill: 'hsl(var(--accent) / 0.5)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={32}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Donut Chart */}
      {categoryData.length > 0 && (
        <div className="glass-panel p-4 mb-4">
          <div className="mb-3 flex items-start gap-2.5">
            <Target className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold">Proporção por categoria</h3>
              <p className="text-muted-foreground text-sm">Distribuição percentual das despesas do mês</p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="h-64 w-64 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [currency(value), 'Gasto']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '13px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start flex-1">
              {categoryData.map((cat, i) => {
                const total = categoryData.reduce((s, c) => s + c.value, 0);
                const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                return (
                  <div key={cat.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent border border-border text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Evolution Chart */}
      {evolutionData.some(d => d.receitas > 0 || d.despesas > 0) && (
        <div className="glass-panel p-4 mb-4">
          <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2.5">
              <LineChartIcon className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold">Evolução mensal</h3>
                <p className="text-muted-foreground text-sm">Receitas vs despesas nos últimos {evolutionPeriod} meses</p>
              </div>
            </div>
            <div className="inline-flex rounded-xl bg-accent border border-border p-0.5 shrink-0" role="tablist" aria-label="Período">
              {([3, 6, 12] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={evolutionPeriod === p}
                  onClick={() => setEvolutionPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    evolutionPeriod === p
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p}M
                </button>
              ))}
            </div>
          </div>
          <div className="h-52 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis width={42} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number, name: string) => [currency(value), name === 'receitas' ? 'Receitas' : 'Despesas']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '13px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                />
                <Legend formatter={(value: string) => value === 'receitas' ? 'Receitas' : 'Despesas'} />
                <Line type="monotone" dataKey="receitas" stroke="hsl(142, 71%, 45%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(142, 71%, 45%)' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="despesas" stroke="hsl(0, 84%, 60%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(0, 84%, 60%)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Month comparison */}
      {comparison.length > 0 && (
        <div className="glass-panel p-4 mb-4">
        <div className="mb-3 flex items-start gap-2.5">
          <ArrowUpRight className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Comparação com mês anterior</h3>
            <p className="text-muted-foreground text-sm">
              {monthLabel(currentMonth)} vs {monthLabel(prevMonthStr)} — por categoria
            </p>
          </div>
        </div>
          <div className="flex flex-col gap-2">
            {comparison.map(c => {
              const increased = c.diff > 0;
              const decreased = c.diff < 0;
              const isNew = c.previous === 0 && c.current > 0;
              const removed = c.previous > 0 && c.current === 0;
              return (
                <div key={c.category} className="flex items-center gap-3 p-3 rounded-xl bg-accent border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{c.category}</span>
                      {isNew && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">NOVO</span>}
                      {removed && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">ZEROU</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>Anterior: {currency(c.previous)}</span>
                      <span>Atual: {currency(c.current)}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold shrink-0 ${
                    increased ? 'text-red-600 dark:text-red-400' : decreased ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                  }`}>
                    {increased ? <ArrowUpRight className="w-4 h-4" /> : decreased ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    {c.diff !== 0 ? (
                      <span>{increased ? '+' : ''}{currency(c.diff)}</span>
                    ) : (
                      <span>igual</span>
                    )}
                  </div>
                  {c.pct !== 0 && !isNew && !removed && (
                    <span className={`text-[11px] font-semibold shrink-0 ${increased ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {c.pct > 0 ? '+' : ''}{c.pct}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick numbers */}
      <div className="glass-panel p-4">
        <div className="mb-3 flex items-start gap-2.5">
          <DollarSign className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold">Distribuição rápida</h3>
            <p className="text-muted-foreground text-sm">Quanto entrou, quanto saiu e quanto ainda está pendente</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { label: 'Recebido', value: currency(m.paidIncomes), icon: TrendingUp },
            { label: 'Gasto', value: currency(m.paidExpenses), icon: CreditCard },
            { label: 'Em aberto', value: currency(m.open), icon: HelpCircle },
            { label: 'Sobra estimada', value: currency(m.free), icon: PiggyBank },
          ] as { label: string; value: string; icon: typeof TrendingUp }[]).map(item => (
            <div key={item.label} className="p-3.5 rounded-[18px] bg-accent border border-border leading-relaxed text-sm flex items-start gap-2">
              <item.icon className="size-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <strong>{item.value}</strong><br />{item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
