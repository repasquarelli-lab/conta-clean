import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Shield, Zap, Smartphone, BarChart3, CalendarCheck, PiggyBank, ArrowRight, Sparkles, Star } from 'lucide-react';
import AppLogo from './AppLogo';
import heroIcon from '@/assets/hero-icon.png';
import heroLifestyle from '@/assets/hero-lifestyle.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } }),
};

const floatAnim = {
  y: [0, -12, 0],
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
};

const glowAnim = {
  boxShadow: [
    '0 0 30px hsla(217, 90%, 55%, 0.2)',
    '0 0 60px hsla(217, 90%, 55%, 0.35)',
    '0 0 30px hsla(217, 90%, 55%, 0.2)',
  ],
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
};

export default function Landing() {
  const { setScreen } = useApp();

  return (
    <section className="min-h-screen overflow-hidden relative" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10" style={{ background: 'var(--gradient-bg)' }} />
      <div className="fixed inset-0 -z-10 opacity-30">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Nav */}
        <motion.nav
          className="flex justify-between items-center py-4"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AppLogo size="md" />
          <button
            onClick={() => setScreen('auth')}
            className="px-4 py-2 rounded-xl text-sm font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            Entrar
          </button>
        </motion.nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-8 lg:mt-16">
          {/* Left — Text */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-5">
              <Sparkles className="w-3 h-3" /> Inteligência artificial integrada
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black leading-[1.05] mb-5">
              Sua paz de espírito financeira{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-brand)' }}>
                começa aqui.
              </span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-[540px] mb-8">
              Registre receitas e despesas, acompanhe vencimentos e entenda para onde vai o seu dinheiro — tudo com linguagem clara e em poucos toques.
            </p>

            <div className="flex gap-3 flex-wrap mb-10">
              <button
                onClick={() => setScreen('auth')}
                className="brand-gradient border-none rounded-2xl px-6 py-4 font-bold cursor-pointer text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 text-base"
              >
                Começar grátis <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="glass-panel rounded-2xl px-6 py-4 font-bold cursor-pointer hover:bg-accent transition-colors text-base"
              >
                Conheça os recursos
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-warning gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-muted-foreground">Usado por centenas de famílias</p>
              </div>
            </div>
          </motion.div>

          {/* Right — Hero Image */}
          <motion.div
            className="relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Floating icon */}
            <motion.div
              className="absolute -top-4 -left-4 lg:top-0 lg:-left-8 z-20 w-24 h-24 md:w-32 md:h-32"
              variants={float}
              animate="animate"
            >
              <motion.img
                src={heroIcon}
                alt="Conta Clara Lite"
                className="w-full h-full object-contain drop-shadow-2xl rounded-3xl"
                variants={glow}
                animate="animate"
              />
            </motion.div>

            {/* Main lifestyle image */}
            <div className="relative max-w-[520px] w-full">
              <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-[40px] scale-95" />
              <img
                src={heroLifestyle}
                alt="Conta Clara Lite — Sua paz de espírito financeira"
                className="relative w-full rounded-3xl shadow-2xl border border-border/50"
              />

              {/* Floating stat cards */}
              <motion.div
                className="absolute -bottom-4 -left-4 glass-panel p-3 rounded-2xl shadow-lg border border-border/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Economia mensal</p>
                    <p className="text-sm font-bold text-success">+R$ 340</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -top-2 -right-4 glass-panel p-3 rounded-2xl shadow-lg border border-border/50"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Contas em dia</p>
                    <p className="text-sm font-bold text-primary">100%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Quick benefits strip */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16"
          initial="hidden"
          animate="visible"
        >
          {[
            { icon: Zap, title: '2‒3 toques', desc: 'para registrar qualquer conta', color: 'text-warning' },
            { icon: Shield, title: 'Dados seguros', desc: 'salvos na nuvem com criptografia', color: 'text-success' },
            { icon: Smartphone, title: 'Multiplataforma', desc: 'acesse de qualquer aparelho', color: 'text-primary' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              custom={i + 3}
              className="glass-panel p-5 rounded-2xl flex items-start gap-4 hover:shadow-lg transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center shrink-0 border border-border group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <strong className="block text-sm mb-0.5">{item.title}</strong>
                <span className="text-muted-foreground text-xs leading-relaxed">{item.desc}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <div className="mt-20" id="features">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-10">
            <h2 className="text-3xl font-black mb-3">Tudo o que você precisa</h2>
            <p className="text-muted-foreground max-w-[600px] mx-auto leading-relaxed">
              Controle o que entrou, o que saiu, o que vence e quanto ainda sobra — tudo em um só lugar.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: BarChart3, title: 'Controle do mês', desc: 'Painel visual com receitas, despesas, saldo e pendências.' },
              { icon: CalendarCheck, title: 'Contas fixas e agenda', desc: 'Cadastre uma vez e acompanhe vencimentos automáticos.' },
              { icon: PiggyBank, title: 'Parcelamento inteligente', desc: 'Distribua despesas em parcelas ao longo dos meses.' },
              { icon: Sparkles, title: 'Copilot com IA', desc: 'Dicas personalizadas baseadas nos seus dados reais.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="glass-panel p-6 rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 group"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <motion.div
          className="mt-20 mb-10 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden max-w-[700px] mx-auto">
            <div className="absolute inset-0 opacity-10" style={{ background: 'var(--gradient-brand)' }} />
            <img src={heroIcon} alt="" className="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-lg relative z-10" />
            <h2 className="text-2xl md:text-3xl font-black mb-3 relative z-10">Pronto para organizar suas finanças?</h2>
            <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
              Crie sua conta gratuitamente e comece a ter clareza sobre seu dinheiro em minutos.
            </p>
            <button
              onClick={() => setScreen('auth')}
              className="brand-gradient border-none rounded-2xl px-8 py-4 font-bold cursor-pointer text-primary-foreground flex items-center gap-2 shadow-xl mx-auto relative z-10 text-base hover:shadow-2xl active:scale-95 transition-all"
            >
              Criar minha conta grátis <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Conta Clara · Feito com carinho para simplificar sua vida financeira
          </p>
        </div>
      </div>
    </section>
  );
}
