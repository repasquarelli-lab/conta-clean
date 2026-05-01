import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  HeartPulse,
  PiggyBank,
  Target,
  ShieldCheck,
  Lightbulb,
  ArrowLeft,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ---------- Dados estáticos para a demonstração ----------
const evolution = [
  { month: 'Jun', receitas: 5200, despesas: 4100 },
  { month: 'Jul', receitas: 5400, despesas: 4600 },
  { month: 'Ago', receitas: 5300, despesas: 5100 },
  { month: 'Set', receitas: 5800, despesas: 4500 },
  { month: 'Out', receitas: 6100, despesas: 4700 },
  { month: 'Nov', receitas: 6000, despesas: 4400 },
];

const categories = [
  { name: 'Moradia', value: 1800, color: 'hsl(217 91% 60%)' },
  { name: 'Alimentação', value: 1100, color: 'hsl(142 71% 45%)' },
  { name: 'Transporte', value: 600, color: 'hsl(38 92% 50%)' },
  { name: 'Lazer', value: 450, color: 'hsl(280 80% 60%)' },
  { name: 'Outros', value: 450, color: 'hsl(0 72% 51%)' },
];

const currency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const score = 78; // exemplo
const scoreColor =
  score >= 80
    ? 'text-emerald-500'
    : score >= 60
    ? 'text-blue-500'
    : score >= 40
    ? 'text-yellow-500'
    : 'text-red-500';
const scoreLabel =
  score >= 80
    ? 'Excelente'
    : score >= 60
    ? 'Boa'
    : score >= 40
    ? 'Atenção'
    : 'Crítica';

const tips = [
  {
    icon: TrendingUp,
    color: 'text-emerald-500',
    title: 'Mês positivo',
    text: 'Seu saldo está em R$ 1.600,00 este mês. Considere reservar parte para emergências.',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-500',
    title: 'Fixas sob controle',
    text: 'Suas contas fixas representam 35% da renda — dentro de uma faixa saudável (ideal abaixo de 60%).',
  },
  {
    icon: Target,
    color: 'text-yellow-500',
    title: 'Atenção em Alimentação',
    text: 'Categoria representa 24% dos gastos. Comparar mercados pode trazer economia.',
  },
];

export default function ResumoDemo() {
  const totalDespesas = categories.reduce((s, c) => s + c.value, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header demo */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Demonstração — sem login
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-24">
        {/* Hero educacional */}
        <section className="rounded-2xl border border-border/50 bg-card/60 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <h1 className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Como funciona o Resumo
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Esta é uma prévia da tela de <strong>Resumo</strong> do Conta Clara
            Lite. Os números abaixo são <em>fictícios</em> e servem apenas para
            mostrar o que você verá após o cadastro. Use esta página para
            entender as principais funcionalidades antes de criar sua conta.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
            >
              <Lock className="h-4 w-4" />
              Criar conta gratuita
            </Link>
            <span className="inline-flex items-center rounded-xl border border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              3 dias grátis · sem cartão
            </span>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Receitas',
              value: 'R$ 6.000',
              icon: TrendingUp,
              tone: 'text-emerald-500',
            },
            {
              label: 'Despesas',
              value: 'R$ 4.400',
              icon: TrendingDown,
              tone: 'text-red-500',
            },
            {
              label: 'Saldo',
              value: 'R$ 1.600',
              icon: PiggyBank,
              tone: 'text-blue-500',
            },
            {
              label: 'Economia',
              value: '27%',
              icon: Target,
              tone: 'text-purple-500',
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </span>
                <kpi.icon className={`h-4 w-4 ${kpi.tone}`} />
              </div>
              <div className="mt-2 text-xl font-bold sm:text-2xl">{kpi.value}</div>
            </div>
          ))}
        </section>

        {/* Saúde Financeira */}
        <section className="rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm sm:p-6">
          <header className="mb-4 flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Saúde Financeira</h2>
          </header>
          <div className="flex items-center gap-6">
            <div
              className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-current text-3xl font-bold ${scoreColor}`}
            >
              {score}
            </div>
            <div className="flex-1">
              <p className={`text-lg font-semibold ${scoreColor}`}>{scoreLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Score calculado com base em economia, contas fixas, metas e
                disciplina de pagamentos.
              </p>
            </div>
          </div>
        </section>

        {/* Gráfico de evolução */}
        <section className="rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm sm:p-6">
          <h2 className="mb-3 text-lg font-semibold">Evolução mensal</h2>
          <div className="h-52 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={evolution}
                margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 9 }} width={42} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => currency(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="receitas"
                  name="Receitas"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  name="Despesas"
                  stroke="hsl(0 72% 51%)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Categorias */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
            <h2 className="mb-3 text-lg font-semibold">Por categoria</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {categories.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => currency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
            <h2 className="mb-3 text-lg font-semibold">Detalhamento</h2>
            <ul className="space-y-2">
              {categories.map((c) => {
                const pct = Math.round((c.value / totalDespesas) * 100);
                return (
                  <li key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </span>
                      <span className="font-medium">
                        {currency(c.value)}{' '}
                        <span className="text-muted-foreground">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Dicas */}
        <section className="rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm sm:p-6">
          <header className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Dicas personalizadas</h2>
          </header>
          <div className="grid gap-3 sm:grid-cols-3">
            {tips.map((tip) => (
              <div
                key={tip.title}
                className="rounded-xl border border-border/40 bg-background/40 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <tip.icon className={`h-4 w-4 ${tip.color}`} />
                  <h3 className="text-sm font-semibold">{tip.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {tip.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-purple-500/10 p-6 text-center sm:p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Pronto para ver os <em>seus</em> números?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Cadastre-se em menos de 1 minuto e comece a usar gratuitamente por 3
            dias. Sem cartão, sem complicação.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            Começar agora
          </Link>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Dados desta página são fictícios e servem apenas para demonstração.
        </p>
      </main>
    </div>
  );
}
