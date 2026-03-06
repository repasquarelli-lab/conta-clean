import { useApp } from '@/contexts/AppContext';
import { dueTodayBills, upcomingBills, overdueBills, todayISO } from '@/lib/store';
import BillItem from '../BillItem';

export default function AgendaView() {
  const { state } = useApp();

  const today = dueTodayBills(state);
  const week = upcomingBills(state, 7).filter(e => e.date !== todayISO());
  const overdue = overdueBills(state);

  const sections = [
    { title: 'Vence hoje', subtitle: 'Prioridade máxima', items: today, getLabel: () => 'Hoje', variant: 'bad' as const, emptyMsg: 'Nenhuma conta vence hoje.' },
    { title: 'Próximos 7 dias', subtitle: 'Para você se organizar', items: week, getLabel: (e: any) => e.delta === 1 ? 'Amanhã' : `Em ${e.delta} dias`, variant: 'warn' as const, emptyMsg: 'Nenhuma conta nesta semana.' },
    { title: 'Atrasadas', subtitle: 'Contas que já passaram do prazo', items: overdue, getLabel: () => 'Atrasada', variant: 'bad' as const, emptyMsg: 'Nenhuma conta atrasada.' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {sections.map(section => (
        <div key={section.title} className="glass-panel p-4">
          <div className="mb-3">
            <h3 className="font-bold">{section.title}</h3>
            <p className="text-muted-foreground text-sm">{section.subtitle}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {section.items.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-border text-muted-foreground text-center text-sm">{section.emptyMsg}</div>
            ) : section.items.map(e => (
              <BillItem key={e.id} entry={e} label={section.getLabel(e)} variant={section.variant} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
