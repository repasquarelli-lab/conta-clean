import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Loader2, ArrowRight, Bot, ScanLine, Target, CreditCard, BarChart3, Bell, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AppLogo from '@/components/AppLogo';
import { Button } from '@/components/ui/button';

type Info = { subscribed: boolean; interval: string | null; trialing: boolean; end: string | null };

const BENEFITS = [
  { icon: BarChart3, text: 'Lançamentos, contas fixas e parcelas sem limite' },
  { icon: CreditCard, text: 'Cartões de crédito com fatura organizada' },
  { icon: Bot, text: 'Copiloto com inteligência artificial e dicas' },
  { icon: ScanLine, text: 'Leitura de recibos por foto' },
  { icon: Target, text: 'Metas financeiras com sugestões' },
  { icon: Bell, text: 'Lembretes de contas e relatório mensal por e-mail' },
  { icon: ShieldCheck, text: 'Seus dados protegidos e exportáveis' },
];

export default function BemVindo() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Stripe may take a few seconds to confirm — retry briefly
      for (let i = 0; i < 6 && !cancelled; i++) {
        const { data } = await supabase.functions.invoke('check-subscription');
        if (data?.subscribed || i === 5) {
          if (!cancelled) setInfo({ subscribed: !!data?.subscribed, interval: data?.plan_interval ?? null, trialing: !!data?.subscription_trialing, end: data?.subscription_end ?? null });
          return;
        }
        await new Promise(r => setTimeout(r, 2500));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const annual = info?.interval === 'year';
  const planName = annual ? 'Plano Anual' : 'Plano Mensal';
  const price = annual ? 'R$ 159,90/ano' : 'R$ 14,90/mês';
  const endDate = info?.end ? new Date(info.end).toLocaleDateString('pt-BR') : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex justify-center"><AppLogo size="md" /></div>

        {!info ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="font-semibold">Confirmando seu pagamento…</p>
            <p className="text-sm text-muted-foreground">Isso leva só alguns segundos.</p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }} className="mx-auto size-16 rounded-full bg-primary/15 flex items-center justify-center">
                <CheckCircle2 className="size-9 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-black">{info.subscribed ? 'Bem-vindo(a) ao plano!' : 'Pagamento recebido!'}</h1>
              <p className="text-sm text-muted-foreground">
                {info.subscribed ? 'Tudo pronto. Agora é só organizar suas finanças com tranquilidade.' : 'Estamos finalizando a confirmação. Seu acesso será liberado em instantes.'}
              </p>
            </div>

            {info.subscribed && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-1"><Sparkles className="size-3.5" /> Plano ativo</p>
                  <p className="text-lg font-black">{planName}</p>
                  <p className="text-xs text-muted-foreground">
                    {info.trialing && endDate ? `Primeira cobrança em ${endDate}` : endDate ? `Renova em ${endDate}` : ''}
                  </p>
                </div>
                <p className="text-base font-black text-primary whitespace-nowrap">{price}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <p className="text-sm font-bold">O que está incluído:</p>
              {BENEFITS.map(({ icon: Icon, text }, i) => (
                <motion.div key={text} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="flex items-center gap-3 text-sm">
                  <span className="size-8 rounded-xl bg-accent flex items-center justify-center shrink-0"><Icon className="size-4 text-primary" /></span>
                  {text}
                </motion.div>
              ))}
            </div>

            <Button size="lg" className="w-full rounded-2xl font-bold" onClick={() => navigate('/', { replace: true })}>
              Começar a usar <ArrowRight className="size-4 ml-1" />
            </Button>
          </>
        )}
      </motion.div>
    </main>
  );
}
