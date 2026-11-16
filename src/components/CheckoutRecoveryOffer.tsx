import { CreditCard, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CheckoutPlan } from '@/lib/checkoutRecovery';

interface Props {
  open: boolean;
  busy: boolean;
  trialActive: boolean;
  onDismiss: () => void;
  onCheckout: (plan: CheckoutPlan) => Promise<void>;
}

export default function CheckoutRecoveryOffer({ open, busy, trialActive, onDismiss, onCheckout }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onDismiss(); }}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] rounded-2xl max-h-[85dvh] overflow-y-auto">
        <Sparkles className="size-8 text-primary" aria-hidden="true" />
        <DialogHeader>
          <DialogTitle className="text-xl tracking-normal">Prefere começar pelo mensal?</DialogTitle>
          <DialogDescription>Você não concluiu a assinatura. Continue com todos os recursos, sem contratar um ano inteiro.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-foreground">R$ 14,90<span className="text-sm font-normal text-muted-foreground"> /mês</span></p>
          <p className="text-sm text-muted-foreground">Renovação mensal automática. Cancele quando quiser.</p>
          {trialActive && <p className="text-sm text-primary">A primeira cobrança acontece ao final do seu teste grátis.</p>}
        </div>
        <ul className="space-y-2 text-sm text-foreground">
          {['Lançamentos e cartões de crédito', 'Copiloto IA, metas e leitura de recibos', 'Gráficos, lembretes e relatório mensal'].map(item => (
            <li key={item} className="flex items-start gap-2"><Check className="size-4 shrink-0 text-primary mt-0.5" />{item}</li>
          ))}
        </ul>
        <Button disabled={busy} onClick={() => void onCheckout('monthly')} className="w-full h-auto min-h-11 whitespace-normal">
          <CreditCard />{busy ? 'Abrindo pagamento...' : 'Continuar com o mensal — R$ 14,90'}
        </Button>
        <Button disabled={busy} variant="outline" onClick={() => void onCheckout('annual')} className="w-full h-auto min-h-11 whitespace-normal">
          Anual — R$ 159,90 (economize R$ 18,90/ano)
        </Button>
        <Button variant="ghost" onClick={onDismiss}>Agora não</Button>
      </DialogContent>
    </Dialog>
  );
}