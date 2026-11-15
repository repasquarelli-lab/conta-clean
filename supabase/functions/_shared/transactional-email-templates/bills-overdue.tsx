import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Conta Clara Lite"
const SITE_URL = "https://appcontaclaralite.lovable.app"

interface Bill { name: string; value: string; date: string }
interface Props { userName?: string; bills?: Bill[]; total?: string }

const BillsOverdueEmail = ({ userName, bills = [], total }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{bills.length === 1 ? 'Uma conta fixa venceu ontem' : `${bills.length} contas fixas venceram ontem`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={heroSection}>
          <Text style={emoji}>🔔</Text>
          <Heading style={h1}>{userName ? `Olá, ${userName}!` : 'Olá!'}</Heading>
        </Section>
        <Text style={text}>
          {bills.length === 1 ? 'Esta conta fixa venceu ontem e ainda não foi marcada como paga:' : 'Estas contas fixas venceram ontem e ainda não foram marcadas como pagas:'}
        </Text>
        <Section style={box}>
          {bills.map((b, i) => (
            <Text key={i} style={row}><strong>{b.name}</strong> — {b.value} <span style={muted}>(venceu {b.date})</span></Text>
          ))}
          {total && <Text style={{ ...row, marginTop: '8px' }}>Total: <strong>{total}</strong></Text>}
        </Section>
        <Text style={text}>Se você já pagou, é só abrir o app e marcar como paga.</Text>
        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Button href={SITE_URL} style={button}>Abrir o app</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Você pode desligar este aviso em Configurações → Notificações. Obrigado por usar o {SITE_NAME}!</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BillsOverdueEmail,
  subject: (d: Record<string, any>) => (d?.bills?.length || 0) > 1 ? `🔔 ${d.bills.length} contas fixas em atraso` : '🔔 Você tem uma conta fixa em atraso',
  displayName: 'Contas fixas em atraso',
  previewData: { userName: 'Maria', bills: [{ name: 'Aluguel', value: 'R$ 1.200,00', date: '10/11' }], total: 'R$ 1.200,00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '520px', margin: '0 auto' }
const heroSection = { textAlign: 'center' as const, marginBottom: '24px' }
const emoji = { fontSize: '48px', margin: '0 0 8px', lineHeight: '1' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: 'hsl(220, 30%, 15%)', margin: '0 0 8px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: 'hsl(220, 15%, 45%)', lineHeight: '1.6', margin: '0 0 16px' }
const box = { backgroundColor: 'hsl(0, 85%, 97%)', borderRadius: '12px', padding: '14px 18px', margin: '0 0 16px' }
const row = { fontSize: '14px', color: 'hsl(220, 30%, 15%)', margin: '4px 0' }
const muted = { color: 'hsl(220, 15%, 55%)' }
const button = { backgroundColor: 'hsl(221, 83%, 53%)', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: 'hsl(220, 15%, 85%)', margin: '24px 0' }
const footer = { fontSize: '13px', color: 'hsl(220, 15%, 60%)', margin: '24px 0 0', textAlign: 'center' as const }
