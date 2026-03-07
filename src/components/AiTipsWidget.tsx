import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { monthMetrics, currency, budgetProgress, topCategory, paidCount, getMonthEntries } from '@/lib/store';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AiTip {
  emoji: string;
  title: string;
  tip: string;
}

export default function AiTipsWidget() {
  const { state, currentMonth } = useApp();
  const [tips, setTips] = useState<AiTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const generateTips = async () => {
    setLoading(true);
    setError(null);

    try {
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

      const financialData = `
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
`.trim();

      const { data, error: fnError } = await supabase.functions.invoke('ai-tips', {
        body: { financialData },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      
      setTips(data.tips || []);
      setGenerated(true);
    } catch (e: any) {
      console.error('AI tips error:', e);
      setError(e.message || 'Erro ao gerar dicas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-bold">Copilot Financeiro</h3>
            <p className="text-muted-foreground text-sm">Dicas personalizadas com IA</p>
          </div>
        </div>
        <button
          onClick={generateTips}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {generated ? 'Atualizar' : 'Gerar dicas'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!generated && !loading && !error && (
        <div className="p-6 rounded-2xl border border-dashed border-border text-center text-muted-foreground text-sm">
          Clique em <strong>"Gerar dicas"</strong> para receber insights personalizados sobre suas finanças deste mês.
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 rounded-2xl bg-accent border border-border animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6 mt-1" />
            </div>
          ))}
        </div>
      )}

      {generated && !loading && tips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tips.map((tip, i) => (
            <div key={i} className="p-4 rounded-2xl bg-accent border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{tip.emoji}</span>
                <span className="font-semibold text-sm">{tip.title}</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{tip.tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
