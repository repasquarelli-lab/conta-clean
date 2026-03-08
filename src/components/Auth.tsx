import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable/index';

export default function Auth() {
  const { setScreen, onAuthSuccess } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <section className="min-h-screen grid place-items-center p-4 md:p-6">
      <div className="w-full max-w-[980px] grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-4">
        {/* Left Info */}
        <div className="glass-panel p-7 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl grid place-items-center brand-gradient font-black tracking-wide text-primary-foreground">CC</div>
              <div>
                <h1 className="text-base font-bold">Conta Clara Lite</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Simples de entender. Simples de usar.</p>
              </div>
            </div>
            <h2 className="text-xl font-bold mt-5 mb-2">Seus dados salvos na nuvem.</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Crie sua conta para manter suas contas, lançamentos e metas sincronizados entre dispositivos. Tudo seguro e acessível de qualquer lugar.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { title: 'Sincronizado', desc: 'Dados salvos na nuvem automaticamente.' },
                { title: 'Seguro', desc: 'Seus dados protegidos com login.' },
                { title: 'Multi-dispositivo', desc: 'Acesse de qualquer aparelho.' },
                { title: 'Backup automático', desc: 'Nunca perca seus dados.' },
              ].map(item => (
                <div key={item.title} className="p-3.5 rounded-[20px] border border-border" style={{ background: 'hsla(220,40%,95%,0.03)' }}>
                  <strong className="block text-sm mb-1">{item.title}</strong>
                  <span className="text-muted-foreground text-xs leading-relaxed">{item.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={() => setScreen('landing')} className="glass-panel rounded-2xl px-4 py-3 font-bold cursor-pointer text-sm">Voltar</button>
            </div>
          </div>
          <div className="absolute right-[-70px] bottom-[-70px] w-[220px] h-[220px] rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(260 60% 60%), transparent 72%)' }} />
        </div>

        {/* Auth Form */}
        <div className="glass-panel p-7">
          <h2 className="text-xl font-bold mb-2">
            {mode === 'login' ? 'Entrar na sua conta' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {mode === 'login'
              ? 'Acesse seus dados financeiros salvos na nuvem.'
              : mode === 'signup'
              ? 'Cadastre-se para salvar seus dados com segurança.'
              : 'Informe seu e-mail para receber um link de redefinição.'}
          </p>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
            {mode === 'forgot' ? null : mode === 'signup' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Seu nome</label>
                <input
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Ex.: Norma"
                  required
                  className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm"
              />
            </div>
            {mode !== 'forgot' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm"
                />
              </div>
            )}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none underline text-right -mt-1"
              >
                Esqueci minha senha
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="brand-gradient border-none rounded-2xl px-4 py-3 font-bold cursor-pointer text-primary-foreground mt-2 disabled:opacity-50"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link de recuperação'}
            </button>
          </form>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">ou continue com</span></div>
          </div>
          <button
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error('Erro ao entrar com Google.');
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card hover:bg-accent cursor-pointer transition-colors font-semibold text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
          <div className="mt-4 text-center">
            {mode === 'forgot' ? (
              <button
                onClick={() => setMode('login')}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none underline"
              >
                Voltar ao login
              </button>
            ) : (
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none underline"
              >
                {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
