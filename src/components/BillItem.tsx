import { useApp } from '@/contexts/AppContext';
import { currency, formatDate } from '@/lib/store';
import type { Entry } from '@/lib/store';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { Check, Undo2 } from 'lucide-react';

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
    <div className="flex justify-between gap-3 items-start p-3 rounded-2xl bg-accent border border-border transition-colors hover:border-primary/20">
      <div className="flex gap-2.5 items-start min-w-0">
        <div className="w-8 h-8 rounded-xl grid place-items-center bg-card border border-border shrink-0 mt-0.5">
          <CategoryIcon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <strong className="block mb-0.5 text-sm truncate">{entry.desc}</strong>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{currency(entry.value)}</span> · {entry.category} · {formatDate(entry.date)}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 items-end shrink-0">
        <span className={badgeClass}>{label}</span>
        <button
          onClick={togglePaid}
          className={`${entry.paid ? 'badge-warn' : 'badge-good'} cursor-pointer text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform`}
        >
          {entry.paid ? <><Undo2 className="size-3" /> Desfazer</> : <><Check className="size-3" /> Pagar</>}
        </button>
      </div>
    </div>
  );
}
