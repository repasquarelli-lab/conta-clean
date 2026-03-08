import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { dueTodayBills, upcomingBills, overdueBills, todayISO, getMonthEntries, currency, formatDate } from '@/lib/store';
import BillItem from '../BillItem';
import MonthNavigator from '../MonthNavigator';
import { AlertTriangle, CalendarClock, Clock, CalendarDays, List, LayoutGrid, type LucideIcon } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { motion } from 'framer-motion';

export default function AgendaView() {
  const { state, currentMonth, setCurrentMonth } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const isCurrentMonth = currentMonth === todayISO().slice(0, 7);

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
      <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
        <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
        <div className="flex gap-1 bg-accent rounded-xl p-1 border border-border">
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Lista">
            <List className="size-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Quadro">
            <LayoutGrid className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {sections.map(section => (
            <div key={section.title} className="glass-panel p-4">
              <div className="mb-3 flex items-start gap-2.5">
                <section.icon className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <h3 className="font-bold">{section.title}</h3>
                  <p className="text-muted-foreground text-sm">{section.subtitle}</p>
                </div>
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
      ) : (
        <div className="space-y-4">
          {sections.map(section => (
            <div key={section.title} className="glass-panel p-4">
              <div className="mb-3 flex items-start gap-2.5">
                <section.icon className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <h3 className="font-bold">{section.title}</h3>
                  <p className="text-muted-foreground text-sm">{section.subtitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.items.length === 0 ? (
                  <div className="col-span-full p-4 rounded-2xl border border-dashed border-border text-muted-foreground text-center text-sm">{section.emptyMsg}</div>
                ) : section.items.map(e => {
                  const CatIcon = getCategoryIcon(e.category);
                  const isOverdue = section.variant === 'bad';
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-2xl border flex flex-col gap-3 hover:shadow-md transition-shadow ${isOverdue ? 'bg-red-500/5 border-red-500/20' : 'bg-accent border-border'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl grid place-items-center border shrink-0 ${isOverdue ? 'bg-red-500/10 border-red-500/20' : 'bg-card border-border'}`}>
                          <CatIcon className={`size-4 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{e.desc}</p>
                          <p className="text-[11px] text-muted-foreground">{e.category}</p>
                        </div>
                        <span className={section.variant === 'good' ? 'badge-good' : section.variant === 'warn' ? 'badge-warn' : 'badge-bad'}>
                          {section.getLabel(e)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-lg font-black text-foreground">{currency(e.value)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
