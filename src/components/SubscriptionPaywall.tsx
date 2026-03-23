import { Shield, CreditCard, Sparkles, BarChart3, Bell, Bot, LogOut, Check, Gift, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import AppLogo from '@/components/AppLogo';
import { useState } from 'react';
import { toast } from 'sonner';

interface SubscriptionPaywallProps {
  onCheckout: (plan: 'monthly' | 'annual') => void;
  onBack: () => void;
  loading?: boolean;
  referralCode?: string;
}

const features = [
  { icon: BarChart3, label: 'Dashboard completo com gráficos' },
  { icon: Bot, label: 'Dicas inteligentes com IA' },
  { icon: Bell, label: 'Notificações de contas a vencer' },
  { icon: Sparkles, label: 'Categorias personalizadas ilimitadas' },
  { icon: Shield, label: 'Sincronização segura na nuvem' },
];

export default function SubscriptionPaywall({ onCheckout, onBack, loading, referralCode }: SubscriptionPaywallProps) {
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');

  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : null;

  function copyReferralLink() {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Link copiado! Compartilhe com seus amigos.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex justify-center">
              <AppLogo size="lg" showText={false} />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Seu período gratuito expirou
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Continue usando todos os recursos do Conta Clara Lite
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Referral Banner */}
            {referralLink && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <Gift className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">Ganhe 1 mês grátis!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Indique o aplicativo a um amigo através do link abaixo e ganhe um mês grátis quando ele assinar.
                    </p>
                    <button
                      onClick={copyReferralLink}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      <Share2 className="size-3" />
                      Copiar link de indicação
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Plan selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelected('monthly')}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  selected === 'monthly'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {selected === 'monthly' && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}
                <p className="text-xs font-medium text-muted-foreground">Mensal</p>
                <p className="text-xl font-bold text-foreground mt-1">R$ 14,90</p>
                <p className="text-xs text-muted-foreground">/mês</p>
              </button>

              <button
                onClick={() => setSelected('annual')}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  selected === 'annual'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {selected === 'annual' && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}
                <div className="absolute -top-2.5 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ECONOMIZE 11%
                </div>
                <p className="text-xs font-medium text-muted-foreground">Anual</p>
                <p className="text-xl font-bold text-foreground mt-1">R$ 159,90</p>
                <p className="text-xs text-muted-foreground">R$ 13,33/mês</p>
              </button>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <f.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{f.label}</span>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={() => onCheckout(selected)}
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {selected === 'annual' ? 'Assinar plano anual' : 'Assinar plano mensal'}
            </Button>

            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full text-muted-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Voltar e sair
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancele a qualquer momento. Pagamento seguro via Stripe.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
