import { useApp } from '@/contexts/AppContext';
import { monthMetrics, currency, budgetProgress, topCategory, paidCount, getMonthEntries } from '@/lib/store';

export function useCopilotData() {
  const { state, currentMonth } = useApp();

  const buildFinancialData = () => {
    const m = monthMetrics(state, currentMonth);
    const counts = paidCount(state, currentMonth);
    const top = topCategory(state, currentMonth);
    const goals = budgetProgress(state, currentMonth);
    const entries = getMonthEntries(state, currentMonth);

    const categoryBreakdown = entries
      .filter(e => e.type === 'expense')
      .reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.value || 0);
        return acc;
      }, {} as Record<string, number>);

    // Previous month data for trends
    const [y, mo] = currentMonth.split('-').map(Number);
    const prevDate = new Date(y, mo - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const pm = monthMetrics(state, prevMonth);
    const prevCategories = getMonthEntries(state, prevMonth)
      .filter(e => e.type === 'expense')
      .reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.value || 0);
        return acc;
      }, {} as Record<string, number>);

    return `
Mês atual: ${currentMonth}
Receitas: ${currency(m.incomes)}
Despesas totais: ${currency(m.expenses)}
Saldo: ${currency(m.balance)}
Em aberto: ${currency(m.open)}
Gastos fixos: ${currency(m.fixedExpenses)} (${m.incomes ? Math.round((m.fixedExpenses / m.incomes) * 100) : 0}% da renda)
Contas pagas: ${counts.paid}/${counts.total}
Maior categoria: ${top ? `${top[0]} (${currency(top[1])})` : 'Nenhuma'}

Gastos por categoria:
${Object.entries(categoryBreakdown).map(([cat, val]) => `- ${cat}: ${currency(val)}`).join('\n')}

Metas de orçamento:
${goals.map(g => `- ${g.category}: ${currency(g.spent)}/${currency(g.limit)} (${g.pct}%)`).join('\n') || 'Nenhuma meta definida'}

--- Mês anterior (${prevMonth}) ---
Receitas: ${currency(pm.incomes)}
Despesas: ${currency(pm.expenses)}
Saldo: ${currency(pm.balance)}
Gastos por categoria:
${Object.entries(prevCategories).map(([cat, val]) => `- ${cat}: ${currency(val)}`).join('\n') || 'Sem dados'}
`.trim();
  };

  return { buildFinancialData };
}
