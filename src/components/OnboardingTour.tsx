import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useApp } from '@/contexts/AppContext';

const STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bem-vindo(a) ao Conta Clara! 👋',
    content: 'Em poucos passos, vamos te mostrar o essencial para você dominar suas finanças. Leva menos de 1 minuto.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-lancamentos"]',
    title: '1. Cadastre seus lançamentos',
    content: 'Aqui você anota tudo que entra (salário, freelas) e tudo que sai (mercado, contas). Comece pelas contas do mês.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-fixas"]',
    title: '2. Configure contas fixas',
    content: 'Aluguel, internet, plano de saúde… cadastre uma vez e elas aparecem todo mês automaticamente.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-cartoes"]',
    title: '3. Adicione seus cartões',
    content: 'Cada gasto vinculado a um cartão entra na fatura do ciclo. Acompanhe o limite e o vencimento sem surpresas.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: '4. Acompanhe no Painel',
    content: 'Veja saldos, contas a pagar e o resumo do mês. Marque como pago/recebido para o painel ficar sempre atualizado.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="copilot-fab"]',
    placement: 'left',
    title: 'Bônus: Copiloto IA 🤖',
    content: 'Toque a qualquer momento para tirar dúvidas, ver dicas personalizadas e analisar seus gastos.',
    disableBeacon: true,
  },
];

export default function OnboardingTour() {
  const { state, updateState } = useApp();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Start the tour after the UI mounts so targets exist
    if (state.onboardingCompleted === false || state.onboardingCompleted === undefined) {
      const t = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(t);
    }
  }, [state.onboardingCompleted]);

  function handleCallback(data: CallBackProps) {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      updateState(prev => ({ ...prev, onboardingCompleted: true }));
    }
  }

  if (!run) return null;

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
      styles={{
        options: {
          primaryColor: 'hsl(263 70% 50%)',
          zIndex: 10000,
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          textColor: 'hsl(var(--foreground))',
          overlayColor: 'hsla(0, 0%, 0%, 0.55)',
        },
        tooltip: { borderRadius: 16, padding: 18 },
        tooltipTitle: { fontSize: 16, fontWeight: 700 },
        tooltipContent: { fontSize: 14, lineHeight: 1.5 },
        buttonNext: { borderRadius: 12, padding: '8px 16px', fontWeight: 700 },
        buttonBack: { color: 'hsl(var(--muted-foreground))', marginRight: 8 },
        buttonSkip: { color: 'hsl(var(--muted-foreground))' },
      }}
    />
  );
}
