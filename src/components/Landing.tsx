import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Shield, Zap, Smartphone, BarChart3, CalendarCheck, PiggyBank, ArrowRight, Sparkles } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
};

export default function Landing() {
  const { setScreen } = useApp();

  return (
    <section className="min-h-screen p-4 md:p-6 overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
          <motion.div
            className="glass-panel p-7 md:p-10 relative overflow-hidden glow-blue"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="flex justify-between gap-3 items-center flex-wrap relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl grid place-items-center brand-gradient font-black tracking-wide text-primary-foreground shadow-lg">CC</div>
                <div>
                  <h1 className="text-base font-bold">Conta Clara</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Finanças pessoais simplificadas</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" /> Com inteligência artificial
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-[3.2rem] font-black leading-[1.05] mt-6 mb-4 max-w-[680px] relative z-10">
              Suas contas organizadas de forma{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-brand)' }}>
                simples e inteligente.
              </span>
            </h2>
            <p className="max-w-[640px] text-muted-foreground text-base leading-relaxed relative z-10">
              Registre receitas e despesas, acompanhe vencimentos e entenda para onde vai o seu dinheiro — tudo com linguagem clara e em poucos toques.
            </p>

            <div className="flex gap-3 flex-wrap mt-7 relative z-10">
              <button
                onClick={() => setScreen('auth')}
                className="brand-gradient border-none rounded-2xl px-5 py-3.5 font-bold cursor-pointer text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
              >
                Começar agora <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="glass-panel rounded-2xl px-5 py-3.5 font-bold cursor-pointer hover:bg-accent transition-colors"
              >
                Conheça os recursos
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8 relative z-10">
              {[
                { icon: Zap, title: '2‒3 toques', desc: 'para registrar qualquer conta' },
                { icon: Shield, title: 'Dados seguros', desc: 'salvos na nuvem com login' },
                { icon: Smartphone, title: 'Multiplataforma', desc: 'acesse de qualquer aparelho' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i + 2}
                  className="p-4 rounded-[20px] border border-border bg-card/30 backdrop-blur-sm"
                >
                  <item.icon className="w-5 h-5 text-primary mb-2" />
                  <strong className="block text-sm mb-0.5">{item.title}</strong>
                  <span className="text-muted-foreground text-xs leading-relaxed">{item.desc}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Side */}
          <div className="grid gap-5">
            <motion.div className="glass-panel p-6" variants={fadeUp} custom={1} initial="hidden" animate="visible">
              <h3 className="text-base font-bold mb-3">Por que o Conta Clara?</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Feito para quem quer controlar as finanças da casa sem complicação. Sem jargão técnico, sem integração com banco — apenas o que você precisa ver.
              </p>
              <div className="grid gap-2.5 mt-4">
                {[
                  { icon: BarChart3, text: 'Painel do mês com visão completa' },
                  { icon: CalendarCheck, text: 'Agenda de vencimentos com alertas' },
                  { icon: PiggyBank, text: 'Metas de orçamento por categoria' },
                  { icon: Sparkles, text: 'Dicas personalizadas com IA' },
                ].map(f => (
                  <div key={f.text} className="p-3 rounded-2xl border border-border text-sm flex items-center gap-3 bg-card/30">
                    <f.icon className="w-4 h-4 text-primary shrink-0" />
                    {f.text}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="glass-panel p-6" variants={fadeUp} custom={2} initial="hidden" animate="visible">
              <h3 className="text-base font-bold mb-2">Pronto para começar?</h3>
              <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                Crie sua conta gratuitamente e comece a organizar suas finanças em minutos.
              </p>
              <button
                onClick={() => setScreen('auth')}
                className="brand-gradient border-none rounded-2xl px-5 py-3 font-bold cursor-pointer text-primary-foreground flex items-center gap-2 shadow-lg"
              >
                Criar minha conta <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-10" id="features">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-2xl font-bold mb-2">Tudo o que você precisa</h2>
            <p className="text-muted-foreground max-w-[720px] leading-relaxed">
              Controle o que entrou, o que saiu, o que vence e quanto ainda sobra — tudo em um só lugar.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            {[
              {
                icon: BarChart3,
                title: 'Controle do mês',
                desc: 'Veja receitas, despesas, saldo e pendências em um painel visual e intuitivo.',
              },
              {
                icon: CalendarCheck,
                title: 'Contas fixas e agenda',
                desc: 'Cadastre uma vez e acompanhe vencimentos automáticos mês a mês.',
              },
              {
                icon: Sparkles,
                title: 'Copilot com IA',
                desc: 'Receba dicas personalizadas baseadas nos seus dados reais para economizar mais.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="glass-panel p-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                <item.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Conta Clara · Feito com carinho para simplificar sua vida financeira
          </p>
        </div>
      </div>
    </section>
  );
}
