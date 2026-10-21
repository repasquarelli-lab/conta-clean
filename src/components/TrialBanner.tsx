import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import type { User } from '@supabase/supabase-js';

/** Shown during the free trial: lets the user activate the paid plan now (charged only when the trial ends). */
export default function TrialBanner({ user }: { user: User | null }) {
  const { subscribed, trialActive, trialDaysLeft, isAdmin, loading, openCheckout } = useSubscription(user) as any;
  const [busy, setBusy] = useState(false);
  if (loading || subscribed || isAdmin || !trialActive) return null;

  const start = async (plan: 'monthly' | 'annual') => {
    setBusy(true);
    await openCheckout(plan);
    setBusy(false);
  };

  return (
    <div className="mb-3 rounded-2xl px-4 py-3 bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <span>
          Você tem <strong>{trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}</strong> grátis.
          Ative seu plano agora e só será cobrado quando o teste acabar.
        </span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => start('monthly')}>
          Ativar plano mensal — R$ 14,90
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl" disabled={busy} onClick={() => start('annual')}>
          Anual R$ 159,90
        </Button>
      </div>
    </div>
  );
}
