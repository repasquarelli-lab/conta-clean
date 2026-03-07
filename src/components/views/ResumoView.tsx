import { useApp } from '@/contexts/AppContext';
import { monthMetrics, paidCount, topCategory, currency, budgetProgress, getMonthEntries, AppState } from '@/lib/store';
import MonthNavigator from '../MonthNavigator';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, ShieldCheck, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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
      color: 'text-emerald-400',
      title: 'Mês positivo',
      text: `Você está com saldo de ${currency(m.balance)}. Continue assim! Se possível, guarde esse valor como reserva.`,
    });
  } else {
    tips.push({
      icon: TrendingDown,
      color: 'text-red-400',
      title: 'Mês no vermelho',
      text: `Suas despesas superaram a renda em ${currency(Math.abs(m.balance))}. Revise gastos variáveis para equilibrar o mês.`,
    });
  }

  // Fixed expenses tip
  if (fixedPct > 70) {
    tips.push({
      icon: AlertTriangle,
      color: 'text-yellow-400',
      title: 'Contas fixas pesando',
      text: `${fixedPct}% da sua renda vai para contas fixas. O ideal é manter abaixo de 60%. Tente renegociar algum contrato.`,
    });
  } else if (fixedPct > 0) {
    tips.push({
      icon: ShieldCheck,
      color: 'text-emerald-400',
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
        color: 'text-yellow-400',
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
      color: 'text-red-400',
      title: `${exceeded.length} meta${exceeded.length > 1 ? 's' : ''} estourada${exceeded.length > 1 ? 's' : ''}`,
      text: exceeded.map(b => `"${b.category}" passou ${b.pct - 100}% do limite (${currency(b.spent)} de ${currency(b.limit)})`).join('. ') + '. Revise esses gastos com atenção.',
    });
  }

  if (nearLimit.length > 0) {
    tips.push({
      icon: Lightbulb,
      color: 'text-yellow-400',
      title: `${nearLimit.length} meta${nearLimit.length > 1 ? 's' : ''} quase no limite`,
      text: nearLimit.map(b => `"${b.category}" está em ${b.pct}%`).join(', ') + '. Cuidado para não ultrapassar até o fim do mês.',
    });
  }

  if (underControl.length > 0 && exceeded.length === 0) {
    tips.push({
      icon: CheckCircle,
      color: 'text-emerald-400',
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
        color: 'text-emerald-400',
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

export default function ResumoView() {
  const { state, currentMonth, setCurrentMonth } = useApp();

  const m = monthMetrics(state, currentMonth);
  const counts = paidCount(state, currentMonth);
  const tips = generateTips(state, currentMonth);
  const comparison = getCategoryComparison(state, currentMonth);
  const prevMonthStr = getPrevMonth(currentMonth);

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

      {/* Quick numbers */}
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
