import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { todayISO } from '@/lib/store';

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function MonthNavigator({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const [y, m] = month.split('-').map(Number);
  const isCurrentMonth = month === todayISO().slice(0, 7);

  function shift(delta: number) {
    const d = new Date(y, m - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => shift(-1)} className="w-9 h-9 rounded-xl grid place-items-center bg-accent border border-border cursor-pointer hover:bg-card transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent border border-border min-w-[160px] justify-center">
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
        <span className="font-bold text-sm">{MONTH_NAMES[m - 1]} {y}</span>
      </div>
      <button onClick={() => shift(1)} className="w-9 h-9 rounded-xl grid place-items-center bg-accent border border-border cursor-pointer hover:bg-card transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
      {!isCurrentMonth && (
        <button onClick={() => onChange(todayISO().slice(0, 7))} className="px-3 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-bold cursor-pointer hover:bg-primary/30 transition-colors">
          Hoje
        </button>
      )}
    </div>
  );
}
