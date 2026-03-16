import { Shield, CreditCard, Sparkles, BarChart3, Bell, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface SubscriptionPaywallProps {
  onCheckout: () => void;
  loading?: boolean;
}

const features = [
  { icon: BarChart3, label: 'Dashboard completo com gráficos' },
  { icon: Bot, label: 'Dicas inteligentes com IA' },
  { icon: Bell, label: 'Notificações de contas a vencer' },
  { icon: Sparkles, label: 'Categorias personalizadas ilimitadas' },
  { icon: Shield, label: 'Sincronização segura na nuvem' },
];

export default function SubscriptionPaywall({ onCheckout, loading }: SubscriptionPaywallProps) {
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
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Seu período gratuito expirou
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Continue usando todos os recursos do Conta Clara Lite por apenas
            </p>
            <p className="text-3xl font-bold text-primary mt-2">
              R$ 14,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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
              onClick={onCheckout}
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Assinar agora
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
