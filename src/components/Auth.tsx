import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { makeDemoData, saveState, todayISO } from '@/lib/store';

export default function Auth() {
  const { state, setState, setScreen, setCurrentMonth } = useApp();
  const [name, setName] = useState(state.userName || 'Norma');
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [mode, setMode] = useState<'demo' | 'current'>('demo');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let newState = mode === 'demo' ? makeDemoData() : { ...state };
    newState.userName = name.trim() || state.userName || 'Usuário';
    setState(newState);
    setCurrentMonth(month || todayISO().slice(0, 7));
    setScreen('app');
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
            <h2 className="text-xl font-bold mt-5 mb-2">Um app para quem quer paz no fim do mês.</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">Ideal para quem não quer banco conectado, planilha complicada ou interface técnica. Basta entrar, lançar as contas e acompanhar o mês.</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { title: 'Uso prático', desc: 'Registrar, pagar e acompanhar.' },
                { title: 'Visual limpo', desc: 'Foco no que importa.' },
                { title: 'Demo pronta', desc: 'Com dados sintéticos reais.' },
                { title: 'Base comercial', desc: 'Pronta para vender e validar.' },
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
          <h2 className="text-xl font-bold mb-2">Entrar no app</h2>
          <p className="text-muted-foreground text-sm">Preencha apenas o básico para personalizar a experiência.</p>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Seu nome</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Norma" required className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mês de referência</label>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground outline-none text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Modo inicial</label>
              <select value={mode} onChange={e => setMode(e.target.value as 'demo' | 'current')} className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground outline-none text-sm">
                <option value="demo">Abrir com dados demo</option>
                <option value="current">Abrir meus dados atuais</option>
              </select>
            </div>
            <button type="submit" className="brand-gradient border-none rounded-2xl px-4 py-3 font-bold cursor-pointer text-primary-foreground mt-2">
              Abrir painel
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
