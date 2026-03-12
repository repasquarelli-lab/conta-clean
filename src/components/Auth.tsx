import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Cloud, ShieldCheck, Smartphone, DatabaseBackup, ArrowLeft, Mail, Lock, User, LogIn, UserPlus, Send, Eye, EyeOff } from 'lucide-react';
import AppLogo from './AppLogo';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const { setScreen, onAuthSuccess } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await onAuthSuccess.resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
          setMode('login');
        }
        return;
      }
      if (mode === 'signup') {
        const { error } = await onAuthSuccess.signUp(email, password, userName);
        if (error) {
          toast.error(error.message === 'User already registered'
            ? 'Este e-mail já está cadastrado.'
            : error.message);
        } else {
          toast.success('Cadastro realizado! Verifique seu e-mail para confirmar.');
        }
      } else {
        const { error } = await onAuthSuccess.signIn(email, password);
        if (error) {
          toast.error(error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const formVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
  };

  return (
    <section className="min-h-screen grid place-items-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-[980px] grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-4 my-auto">
        {/* Left Info */}
        <div className="glass-panel p-5 md:p-7 relative overflow-hidden">
          <div className="relative z-10">
            <AppLogo size="lg" subtitle="Simples de entender. Simples de usar." />
            <h2 className="text-lg md:text-xl font-bold mt-4 md:mt-5 mb-1.5 md:mb-2">Seus dados salvos na nuvem.</h2>
            <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">
              Crie sua conta para manter suas contas, lançamentos e metas sincronizados entre dispositivos. Tudo seguro e acessível de qualquer lugar.
            </p>
            <div className="grid grid-cols-2 gap-2 md:gap-3 mt-3 md:mt-4">
              {[
                { title: 'Sincronizado', desc: 'Dados salvos na nuvem automaticamente.', icon: Cloud },
                { title: 'Seguro', desc: 'Seus dados protegidos com login.', icon: ShieldCheck },
                { title: 'Multi-dispositivo', desc: 'Acesse de qualquer aparelho.', icon: Smartphone },
                { title: 'Backup automático', desc: 'Nunca perca seus dados.', icon: DatabaseBackup },
              ].map(item => (
                <div key={item.title} className="p-3 md:p-3.5 rounded-[20px] border border-border bg-card/30">
                  <item.icon className="size-4 md:size-5 text-primary mb-1.5 md:mb-2" strokeWidth={1.5} />
                  <strong className="block text-xs md:text-sm mb-0.5 md:mb-1">{item.title}</strong>
                  <span className="text-muted-foreground text-[10px] md:text-xs leading-relaxed">{item.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 md:mt-4">
              <button onClick={() => setScreen('landing')} className="glass-panel rounded-2xl px-3 md:px-4 py-2.5 md:py-3 font-bold cursor-pointer text-xs md:text-sm flex items-center gap-1.5 hover:bg-accent transition-colors">
                <ArrowLeft className="size-3.5 md:size-4" strokeWidth={1.5} /> Voltar
              </button>
            </div>
          </div>
          <div className="absolute right-[-70px] bottom-[-70px] w-[220px] h-[220px] rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--secondary)), transparent 72%)' }} />
        </div>

        {/* Auth Form */}
        <div className="glass-panel p-5 md:p-7">
          <AnimatePresence mode="wait">
            <motion.div key={mode} variants={formVariants} initial="initial" animate="animate" exit="exit">
              <h2 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">
                {mode === 'login' ? 'Entrar na sua conta' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm">
                {mode === 'login'
                  ? 'Acesse seus dados financeiros salvos na nuvem.'
                  : mode === 'signup'
                  ? 'Cadastre-se para salvar seus dados com segurança.'
                  : 'Informe seu e-mail para receber um link de redefinição.'}
              </p>
              <form onSubmit={handleSubmit} className="mt-4 md:mt-5 grid gap-3">
                {mode === 'forgot' ? null : mode === 'signup' && (
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-1 flex items-center gap-1.5">
                      <User className="size-3.5 text-muted-foreground" strokeWidth={1.5} /> Seu nome
                    </label>
                    <input
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="Ex.: Norma"
                      required
                      className="w-full px-3 py-2.5 md:py-3 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs md:text-sm font-medium mb-1 flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" strokeWidth={1.5} /> E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-3 py-2.5 md:py-3 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
                {mode !== 'forgot' && (
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Lock className="size-3.5 text-muted-foreground" strokeWidth={1.5} /> Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                        className="w-full px-3 py-2.5 md:py-3 pr-10 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
                      >
                        {showPassword ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                )}
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none underline text-right -mt-1 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="brand-gradient border-none rounded-2xl px-4 py-2.5 md:py-3 font-bold cursor-pointer text-primary-foreground mt-2 disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Aguarde...
                    </span>
                  ) : (
                    <>
                      {mode === 'login' ? <LogIn className="size-4" strokeWidth={1.5} /> : mode === 'signup' ? <UserPlus className="size-4" strokeWidth={1.5} /> : <Send className="size-4" strokeWidth={1.5} />}
                      {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
                    </>
                  )}
                </button>
              </form>
              <div className="mt-4 md:mt-5 text-center">
                {mode === 'forgot' ? (
                  <button
                    onClick={() => setMode('login')}
                    className="text-xs md:text-sm text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none underline transition-colors"
                  >
                    Voltar ao login
                  </button>
                ) : (
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-xs md:text-sm text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none transition-colors"
                  >
                    {mode === 'login' ? (
                      <>Não tem conta? <span className="underline font-medium text-primary">Cadastre-se</span></>
                    ) : (
                      <>Já tem conta? <span className="underline font-medium text-primary">Entrar</span></>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
