import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CreditCard, Users, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Sub {
  id: string; email: string | null; status: string; interval: string | null; amount: number;
  created: number; trial_end: number | null; current_period_end: number | null;
  cancel_at_period_end: boolean; canceled_at: number | null;
}
interface Charge {
  id: string; email: string | null; amount: number; refunded: number; status: string; paid: boolean;
  failure_message: string | null; created: number; receipt_url: string | null;
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (s: number | null) => (s ? new Date(s * 1000).toLocaleDateString('pt-BR') : '—');

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Ativa', cls: 'bg-primary/15 text-primary' },
  trialing: { label: 'Em teste', cls: 'bg-accent text-accent-foreground' },
  past_due: { label: 'Atrasada', cls: 'bg-destructive/15 text-destructive' },
  unpaid: { label: 'Não paga', cls: 'bg-destructive/15 text-destructive' },
  canceled: { label: 'Cancelada', cls: 'bg-muted text-muted-foreground' },
  incomplete: { label: 'Incompleta', cls: 'bg-muted text-muted-foreground' },
  incomplete_expired: { label: 'Expirada', cls: 'bg-muted text-muted-foreground' },
  succeeded: { label: 'Paga', cls: 'bg-primary/15 text-primary' },
  failed: { label: 'Falhou', cls: 'bg-destructive/15 text-destructive' },
  pending: { label: 'Pendente', cls: 'bg-muted text-muted-foreground' },
};
const Badge = ({ s }: { s: string }) => {
  const v = STATUS[s] || { label: s, cls: 'bg-muted text-muted-foreground' };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${v.cls}`}>{v.label}</span>;
};

export default function AdminBilling() {
  const [tab, setTab] = useState<'subs' | 'charges'>('subs');
  const [subs, setSubs] = useState<Sub[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users?action=billing', { method: 'GET' });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setSubs(data.subscriptions || []);
      setCharges(data.charges || []);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar assinaturas');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const kpi = useMemo(() => {
    const active = subs.filter(s => s.status === 'active');
    const trialing = subs.filter(s => s.status === 'trialing');
    const mrr = active.reduce((a, s) => a + (s.interval === 'year' ? s.amount / 12 : s.amount), 0);
    const since = Date.now() / 1000 - 30 * 86400;
    const revenue30 = charges.filter(c => c.paid && c.created >= since).reduce((a, c) => a + c.amount - c.refunded, 0);
    const failed = charges.filter(c => c.status === 'failed' && c.created >= since).length;
    return { active: active.length, trialing: trialing.length, mrr, revenue30, failed };
  }, [subs, charges]);

  const q = filter.trim().toLowerCase();
  const fSubs = subs.filter(s => !q || (s.email || '').toLowerCase().includes(q) || s.status.includes(q));
  const fCharges = charges.filter(c => !q || (c.email || '').toLowerCase().includes(q) || c.status.includes(q));

  const cards = [
    { icon: Users, label: 'Assinantes ativos', value: String(kpi.active) },
    { icon: Users, label: 'Em teste grátis', value: String(kpi.trialing) },
    { icon: TrendingUp, label: 'Receita mensal recorrente', value: brl(kpi.mrr) },
    { icon: CreditCard, label: 'Recebido (30 dias)', value: brl(kpi.revenue30) },
    { icon: AlertTriangle, label: 'Cobranças falhas (30 dias)', value: String(kpi.failed) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Assinaturas e cobranças</h3>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 glass-panel rounded-xl px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Somente leitura. Nenhum dado financeiro pessoal dos clientes é exibido.</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map(c => (
          <div key={c.label} className="glass-panel rounded-2xl p-3">
            <c.icon className="w-4 h-4 text-primary mb-1" />
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
            <p className="text-lg font-bold">{loading ? '…' : c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex gap-1 glass-panel rounded-xl p-1 w-fit">
          {([['subs', `Assinaturas (${subs.length})`], ['charges', `Cobranças (${charges.length})`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{l}</button>
          ))}
        </div>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar por e-mail"
          className="glass-panel rounded-xl px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary/40 sm:w-64" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : tab === 'subs' ? (
        fSubs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhuma assinatura encontrada.</p> : (
          <div className="space-y-2">
            {fSubs.map(s => (
              <div key={s.id} className="glass-panel rounded-2xl p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm">
                <p className="font-medium truncate md:flex-1">{s.email || '—'}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <Badge s={s.status} />
                  <span>{s.interval === 'year' ? 'Anual' : 'Mensal'} · {brl(s.amount)}</span>
                  <span>Início {dt(s.created)}</span>
                  {s.status === 'trialing' && <span>1ª cobrança {dt(s.trial_end)}</span>}
                  {(s.status === 'active' || s.status === 'past_due') && <span>{s.cancel_at_period_end ? 'Termina' : 'Renova'} {dt(s.current_period_end)}</span>}
                  {s.status === 'canceled' && <span>Cancelada {dt(s.canceled_at)}</span>}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        fCharges.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhuma cobrança encontrada.</p> : (
          <div className="space-y-2">
            {fCharges.map(c => (
              <div key={c.id} className="glass-panel rounded-2xl p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm">
                <p className="font-medium truncate md:flex-1">{c.email || '—'}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <Badge s={c.status} />
                  <span className="font-semibold text-foreground">{brl(c.amount)}</span>
                  {c.refunded > 0 && <span>Reembolsado {brl(c.refunded)}</span>}
                  <span>{dt(c.created)}</span>
                  {c.failure_message && <span className="text-destructive">{c.failure_message}</span>}
                  {c.receipt_url && <a href={c.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Recibo <ExternalLink className="w-3 h-3" /></a>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
