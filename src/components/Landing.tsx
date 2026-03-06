import { useApp } from '@/contexts/AppContext';
import { currency } from '@/lib/store';

export default function Landing() {
  const { setScreen } = useApp();

  return (
    <section className="min-h-screen p-4 md:p-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-4">
          {/* Hero Card */}
          <div className="glass-panel p-6 md:p-8 relative overflow-hidden glow-blue">
            <div className="flex justify-between gap-3 items-center flex-wrap relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl grid place-items-center brand-gradient font-black tracking-wide text-primary-foreground">CC</div>
                <div>
                  <h1 className="text-base font-bold">Conta Clara Lite</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Finanças simples para o dia a dia</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold border" style={{ background: 'hsla(217,100%,72%,0.12)', borderColor: 'hsla(217,100%,72%,0.22)', color: 'hsl(220,40%,90%)' }}>
                MVP v3 • Offline
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-[1.02] mt-5 mb-3.5 max-w-[720px] relative z-10">
              Organize suas contas sem planilha, sem internet e sem complicação.
            </h2>
            <p className="max-w-[700px] text-muted-foreground text-base leading-relaxed relative z-10">
              Um app leve para quem só quer entender o mês, registrar gastos fixos, acompanhar vencimentos e saber quanto ainda sobra. Feito para público leigo, com linguagem simples e navegação direta.
            </p>

            <div className="flex gap-3 flex-wrap mt-6 relative z-10">
              <button onClick={() => setScreen('auth')} className="brand-gradient border-none rounded-2xl px-4 py-3 font-bold cursor-pointer text-primary-foreground">
                Entrar no app
              </button>
              <button onClick={() => document.getElementById('planSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="glass-panel rounded-2xl px-4 py-3 font-bold cursor-pointer">
                Ver proposta do produto
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 relative z-10">
              {[
                { title: '2 a 3 toques', desc: 'para registrar uma conta ou marcar como paga.' },
                { title: '100% offline', desc: 'dados salvos no navegador do aparelho.' },
                { title: 'Linguagem humana', desc: 'sem termos técnicos difíceis.' },
              ].map(item => (
                <div key={item.title} className="p-4 rounded-[20px] border border-border" style={{ background: 'hsla(220,40%,95%,0.03)' }}>
                  <strong className="block text-lg mb-1">{item.title}</strong>
                  <span className="text-muted-foreground text-sm leading-relaxed">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Side Stack */}
          <div className="grid gap-4">
            <div className="glass-panel p-6">
              <h3 className="text-base font-bold mb-3">Por que esse produto faz sentido</h3>
              <p className="text-muted-foreground leading-relaxed">O mercado está cheio de apps complexos. Conta Clara Lite ataca a dor real de quem quer apenas controlar contas da casa, receitas, vencimentos e gastos recorrentes com clareza.</p>
              <div className="grid gap-2.5 mt-4">
                {['Tela inicial com visão do mês', 'Contas fixas que se repetem automaticamente', 'Agenda visual de vencimentos', 'Resumo amigável com leitura rápida'].map(f => (
                  <div key={f} className="p-3 rounded-2xl border border-border text-sm" style={{ background: 'hsla(220,40%,95%,0.03)' }}>{f}</div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6" id="planSection">
              <h3 className="text-base font-bold mb-3">Estratégia comercial inicial</h3>
              <p className="text-muted-foreground leading-relaxed">Produto de entrada para público 40+, famílias, autônomos simples e pessoas que desistiram de apps financeiros mais pesados.</p>
              <div className="flex justify-between gap-2.5 items-end mt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Linha recomendada</div>
                  <strong className="text-3xl">Free + Premium</strong>
                </div>
                <button onClick={() => setScreen('auth')} className="glass-panel rounded-2xl px-4 py-3 font-bold cursor-pointer">Abrir demo</button>
              </div>
            </div>
          </div>
        </div>

        {/* Value Section */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-2.5">O que o MVP resolve muito bem</h2>
          <p className="text-muted-foreground max-w-[860px] leading-relaxed">A proposta não é ser um super app financeiro. A proposta é resolver o básico com excelência: o que entrou, o que saiu, o que vence, o que já foi pago e quanto ainda sobra.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[
              { title: 'Controle do mês', desc: 'Entradas, saídas, saldo e pendências sem excesso de telas ou linguagem difícil.' },
              { title: 'Contas fixas', desc: 'Aluguel, água, energia, internet, farmácia, salão, plano de saúde e outras despesas recorrentes.' },
              { title: 'Previsibilidade', desc: 'A pessoa vê rapidamente o que vence hoje, nesta semana e o que já atrasou.' },
            ].map(item => (
              <div key={item.title} className="glass-panel p-5">
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-2.5">Proposta de monetização</h2>
          <p className="text-muted-foreground max-w-[860px] leading-relaxed">Modelo simples para validar mercado: versão grátis para uso básico e versão premium para ampliar valor percebido.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[
              { title: 'Grátis', desc: 'Uso leve, ideal para aquisição.', items: ['Resumo do mês', 'Lançamentos básicos', 'Contas fixas limitadas', '1 perfil'] },
              { title: 'Premium', desc: 'Ticket baixo, foco em volume.', items: ['Contas fixas ilimitadas', 'Histórico completo', 'Backup facilitado', 'Resumo mais avançado'] },
              { title: 'Família', desc: 'Possível evolução comercial.', items: ['Mais de um perfil', 'Controle da casa', 'Organização compartilhada', 'Base para v4'] },
            ].map(plan => (
              <div key={plan.title} className="glass-panel p-5">
                <h3 className="font-bold mb-2">{plan.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{plan.desc}</p>
                <ul className="mt-3.5 pl-4 text-muted-foreground leading-relaxed text-sm list-disc">
                  {plan.items.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
