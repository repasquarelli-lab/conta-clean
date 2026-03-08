import { useApp } from '@/contexts/AppContext';
import { currency, formatDate } from '@/lib/store';
import type { Entry } from '@/lib/store';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface BillItemProps {
  entry: Entry & { delta?: number };
  label: string;
  variant: 'good' | 'warn' | 'bad';
}

export default function BillItem({ entry, label, variant }: BillItemProps) {
  const { updateState } = useApp();
  const CategoryIcon = getCategoryIcon(entry.category);

  function togglePaid() {
    updateState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === entry.id ? { ...e, paid: !e.paid } : e),
    }));
  }

  const badgeClass = variant === 'good' ? 'badge-good' : variant === 'warn' ? 'badge-warn' : 'badge-bad';

  return (
    <div className="flex justify-between gap-3 items-start p-3 rounded-2xl bg-accent border border-border">
      <div className="flex gap-2.5 items-start">
        <CategoryIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <strong className="block mb-1 text-sm">{entry.desc}</strong>
          <div className="text-xs text-muted-foreground">{entry.category} • vence em {formatDate(entry.date)} • {currency(entry.value)}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2 items-end shrink-0">
        <span className={badgeClass}>{label}</span>
        <button onClick={togglePaid} className="badge-good cursor-pointer text-xs font-bold">Marcar pago</button>
      </div>
    </div>
  );
}
