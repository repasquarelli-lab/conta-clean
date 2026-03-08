import { useApp } from '@/contexts/AppContext';
import { dueTodayBills, upcomingBills, overdueBills, todayISO, getMonthEntries, daysDiff } from '@/lib/store';
import BillItem from '../BillItem';
import MonthNavigator from '../MonthNavigator';
import { AlertTriangle, CalendarClock, Clock, CalendarDays, type LucideIcon } from 'lucide-react';

export default function AgendaView() {
  const { state, currentMonth, setCurrentMonth } = useApp();

  const isCurrentMonth = currentMonth === todayISO().slice(0, 7);

  // For current month, show today/upcoming/overdue. For other months, show all unpaid of that month.
  const today = isCurrentMonth ? dueTodayBills(state) : [];
  const week = isCurrentMonth ? upcomingBills(state, 7).filter(e => e.date !== todayISO()) : [];
  const overdue = isCurrentMonth ? overdueBills(state) : [];

  const monthEntries = !isCurrentMonth
    ? getMonthEntries(state, currentMonth).filter(e => e.type === 'expense').sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const sections: { title: string; subtitle: string; icon: LucideIcon; items: any[]; getLabel: (e: any) => string; variant: 'good' | 'warn' | 'bad'; emptyMsg: string }[] = isCurrentMonth
    ? [
        { title: 'Vence hoje', subtitle: 'Prioridade máxima', icon: Clock, items: today, getLabel: () => 'Hoje', variant: 'bad', emptyMsg: 'Nenhuma conta vence hoje.' },
        { title: 'Próximos 7 dias', subtitle: 'Para você se organizar', icon: CalendarClock, items: week, getLabel: (e: any) => e.delta === 1 ? 'Amanhã' : `Em ${e.delta} dias`, variant: 'warn', emptyMsg: 'Nenhuma conta nesta semana.' },
        { title: 'Atrasadas', subtitle: 'Contas que já passaram do prazo', icon: AlertTriangle, items: overdue, getLabel: () => 'Atrasada', variant: 'bad', emptyMsg: 'Nenhuma conta atrasada.' },
      ]
    : [
        { title: 'Contas do mês', subtitle: 'Todas as despesas deste mês', icon: CalendarDays, items: monthEntries, getLabel: (e: any) => e.paid ? 'Pago' : 'Pendente', variant: 'warn', emptyMsg: 'Nenhuma conta neste mês.' },
      ];

  return (
    <div>
      <div className="mb-4 flex justify-center sm:justify-start">
        <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
      </div>
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
    </div>
  );
}
