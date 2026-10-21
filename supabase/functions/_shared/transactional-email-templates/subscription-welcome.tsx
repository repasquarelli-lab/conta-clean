import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Conta Clara Lite"
const SITE_URL = "https://appcontaclaralite.lovable.app"

const BENEFITS = [
  'Lançamentos, contas fixas e parcelas sem limite',
  'Cartões de crédito com fatura organizada',
  'Copiloto com inteligência artificial e dicas',
  'Leitura de recibos por foto',
  'Metas financeiras com sugestões',
  'Lembretes de contas e relatório mensal por e-mail',
  'Seus dados protegidos e exportáveis',
]

interface Props {
  userName?: string
  planLabel?: string
  amount?: string
  renewalDate?: string
  trialing?: boolean
}

const SubscriptionWelcomeEmail = ({ userName, planLabel = 'Mensal', amount = 'R$ 14,90/mês', renewalDate, trialing }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu Plano {planLabel} está ativo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={heroSection}>
          <Text style={emoji}>🎉</Text>
          <Heading style={h1}>{userName ? `Bem-vindo(a), ${userName}!` : 'Bem-vindo(a)!'}</Heading>
        </Section>

        <Text style={text}>
          Sua assinatura do <strong>{SITE_NAME}</strong> está confirmada. Obrigado pela confiança!
        </Text>

        <Section style={planBox}>
          <Text style={planLabelStyle}>PLANO ATIVO</Text>
          <Text style={planName}>Plano {planLabel} · {amount}</Text>
          {renewalDate && (
            <Text style={planDate}>
              {trialing ? `Primeira cobrança em ${renewalDate}` : `Próxima renovação em ${renewalDate}`}
            </Text>
          )}
        </Section>

        <Text style={{ ...text, fontWeight: '700' as const, color: 'hsl(220, 30%, 15%)' }}>O que está incluído:</Text>
        {BENEFITS.map((b) => (
          <Text key={b} style={item}>✓ {b}</Text>
        ))}

        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Button href={SITE_URL} style={button}>Abrir o app</Button>
        </Section>

        <Text style={text}>
          Para mudar de plano ou cancelar, acesse Configurações → Assinatura no app.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>Obrigado por usar o {SITE_NAME}!</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionWelcomeEmail,
  subject: (d: Record<string, any>) => `🎉 Seu Plano ${d?.planLabel || 'Mensal'} está ativo`,
  displayName: 'Boas-vindas à assinatura',
  previewData: { userName: 'Maria', planLabel: 'Mensal', amount: 'R$ 14,90/mês', renewalDate: '21/11/2026', trialing: false },
} satisfies TemplateEntry

const planBox = { backgroundColor: 'hsl(221, 83%, 96%)', borderRadius: '12px', padding: '16px', margin: '0 0 20px' }
const planLabelStyle = { fontSize: '11px', fontWeight: '700' as const, color: 'hsl(221, 83%, 53%)', margin: '0 0 4px', letterSpacing: '1px' }
const planName = { fontSize: '18px', fontWeight: '700' as const, color: 'hsl(220, 30%, 15%)', margin: '0 0 4px' }
const planDate = { fontSize: '14px', color: 'hsl(220, 15%, 45%)', margin: '0' }
const item = { fontSize: '14px', color: 'hsl(220, 15%, 35%)', margin: '0 0 6px' }
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '520px', margin: '0 auto' }
const heroSection = { textAlign: 'center' as const, marginBottom: '24px' }
const emoji = { fontSize: '48px', margin: '0 0 8px', lineHeight: '1' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: 'hsl(220, 30%, 15%)', margin: '0 0 8px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: 'hsl(220, 15%, 45%)', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: 'hsl(221, 83%, 53%)', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: 'hsl(220, 15%, 85%)', margin: '24px 0' }
const footer = { fontSize: '13px', color: 'hsl(220, 15%, 60%)', margin: '24px 0 0', textAlign: 'center' as const }
