import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Conta Clara Lite"

interface MonthlyReportProps {
  userName?: string
  monthLabel?: string
  incomes?: number
  expenses?: number
  balance?: number
  topCategory?: string
  topCategoryValue?: number
  paidCount?: number
  pendingCount?: number
  aiSummary?: string
  appUrl?: string
}

const fmt = (v?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))

const MonthlyReportEmail = ({
  userName, monthLabel, incomes, expenses, balance,
  topCategory, topCategoryValue, paidCount, pendingCount, aiSummary, appUrl,
}: MonthlyReportProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu resumo financeiro de {monthLabel}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={hero}>
          <Text style={emoji}>📊</Text>
          <Heading style={h1}>Seu mês em revisão</Heading>
          <Text style={subtitle}>{monthLabel}</Text>
        </Section>

        <Text style={greet}>Olá, <strong>{userName || 'amigo(a)'}</strong>!</Text>
        <Text style={text}>
          Aqui vai um resumo do que aconteceu nas suas finanças.
        </Text>

        <Section style={kpiRow}>
          <div style={{ ...kpi, background: 'hsl(142, 76%, 95%)' }}>
            <Text style={kpiLabel}>Recebido</Text>
            <Text style={{ ...kpiValue, color: 'hsl(142, 60%, 30%)' }}>{fmt(incomes)}</Text>
          </div>
          <div style={{ ...kpi, background: 'hsl(0, 76%, 96%)' }}>
            <Text style={kpiLabel}>Gasto</Text>
            <Text style={{ ...kpiValue, color: 'hsl(0, 70%, 40%)' }}>{fmt(expenses)}</Text>
          </div>
        </Section>

        <Section style={{ ...kpi, background: Number(balance) >= 0 ? 'hsl(252, 83%, 96%)' : 'hsl(30, 80%, 96%)', textAlign: 'center', margin: '12px 0' }}>
          <Text style={kpiLabel}>Saldo do mês</Text>
          <Text style={{ ...kpiValue, color: Number(balance) >= 0 ? 'hsl(252, 70%, 45%)' : 'hsl(30, 80%, 40%)', fontSize: 28 }}>
            {fmt(balance)}
          </Text>
        </Section>

        {topCategory && (
          <Text style={text}>
            Categoria com maior gasto: <strong>{topCategory}</strong> ({fmt(topCategoryValue)}).
          </Text>
        )}
        <Text style={text}>
          Contas pagas: <strong>{paidCount || 0}</strong> · Em aberto: <strong>{pendingCount || 0}</strong>.
        </Text>

        {aiSummary && (
          <Section style={aiBox}>
            <Text style={aiLabel}>💡 Insight do Copiloto</Text>
            <Text style={aiText}>{aiSummary}</Text>
          </Section>
        )}

        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={appUrl || 'https://appcontaclaralite.lovable.app'} style={btn}>
            Abrir o {SITE_NAME}
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Você recebe este resumo todo dia 1º. Para parar, ajuste em Configurações.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MonthlyReportEmail,
  subject: (d: Record<string, any>) => `📊 Seu resumo de ${d.monthLabel || 'do mês'}`,
  displayName: 'Relatório mensal',
  previewData: {
    userName: 'João',
    monthLabel: 'novembro de 2025',
    incomes: 5000, expenses: 3200, balance: 1800,
    topCategory: 'Mercado', topCategoryValue: 850,
    paidCount: 12, pendingCount: 2,
    aiSummary: 'Você economizou 18% mais que no mês passado. Continue assim!',
    appUrl: 'https://appcontaclaralite.lovable.app',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const hero = { textAlign: 'center' as const, marginBottom: '20px' }
const emoji = { fontSize: '44px', margin: '0 0 4px', lineHeight: '1' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(220, 30%, 15%)', margin: '0', textAlign: 'center' as const }
const subtitle = { fontSize: '14px', color: 'hsl(220, 15%, 50%)', margin: '4px 0 0', textAlign: 'center' as const }
const greet = { fontSize: '15px', color: 'hsl(220, 30%, 20%)', margin: '0 0 8px' }
const text = { fontSize: '14px', color: 'hsl(220, 15%, 35%)', lineHeight: '1.6', margin: '0 0 12px' }
const kpiRow = { display: 'flex' as const, gap: '8px', margin: '12px 0' }
const kpi = { padding: '12px 16px', borderRadius: '12px', flex: 1 }
const kpiLabel = { fontSize: '12px', color: 'hsl(220, 15%, 40%)', margin: '0 0 4px', fontWeight: 600 as const }
const kpiValue = { fontSize: '20px', fontWeight: 800 as const, margin: 0 }
const aiBox = { padding: '14px 16px', background: 'hsl(252, 83%, 97%)', borderRadius: '12px', borderLeft: '4px solid hsl(252, 83%, 60%)', margin: '16px 0' }
const aiLabel = { fontSize: '12px', fontWeight: 700 as const, color: 'hsl(252, 70%, 45%)', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const aiText = { fontSize: '14px', color: 'hsl(220, 30%, 25%)', margin: 0, lineHeight: '1.5' }
const btn = { backgroundColor: 'hsl(252, 83%, 60%)', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { borderColor: 'hsl(220, 15%, 90%)', margin: '24px 0 16px' }
const footer = { fontSize: '12px', color: 'hsl(220, 15%, 60%)', margin: 0, textAlign: 'center' as const }
