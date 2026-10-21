import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Conta Clara Lite"
const SITE_URL = "https://appcontaclaralite.lovable.app"

interface TrialEndingProps {
  userName?: string
  /** true = card on file, will be charged automatically */
  willBeCharged?: boolean
  amount?: string
  planLabel?: string
}

const TrialEndingEmail = ({ userName, willBeCharged, amount = 'R$ 14,90', planLabel = 'mensal' }: TrialEndingProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>
      {willBeCharged ? `Amanhã sua assinatura ${planLabel} começa` : 'Seu teste grátis termina amanhã'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={heroSection}>
          <Text style={emoji}>⏰</Text>
          <Heading style={h1}>{userName ? `Olá, ${userName}!` : 'Olá!'}</Heading>
        </Section>

        {willBeCharged ? (
          <>
            <Text style={text}>
              Seu teste grátis do <strong>{SITE_NAME}</strong> termina <strong>amanhã</strong>.
              A partir daí, seu plano {planLabel} de <strong>{amount}</strong> será cobrado automaticamente no cartão cadastrado.
            </Text>
            <Text style={text}>
              Não precisa fazer nada para continuar. Se quiser mudar de plano ou cancelar, é só acessar
              Configurações → Assinatura no app antes da cobrança.
            </Text>
          </>
        ) : (
          <>
            <Text style={text}>
              Seu teste grátis do <strong>{SITE_NAME}</strong> termina <strong>amanhã</strong>.
              Para continuar organizando suas contas sem interrupção, ative seu plano agora.
            </Text>
            <Text style={text}>
              Planos a partir de <strong>R$ 14,90/mês</strong>. Seus dados ficam guardados com segurança.
            </Text>
          </>
        )}

        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Button href={SITE_URL} style={button}>
            {willBeCharged ? 'Abrir o app' : 'Ativar meu plano'}
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>Obrigado por usar o {SITE_NAME}!</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TrialEndingEmail,
  subject: (d: Record<string, any>) =>
    d?.willBeCharged ? '⏰ Amanhã sua assinatura começa' : '⏰ Seu teste grátis termina amanhã',
  displayName: 'Fim do teste grátis',
  previewData: { userName: 'Maria', willBeCharged: true, amount: 'R$ 14,90', planLabel: 'mensal' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '520px', margin: '0 auto' }
const heroSection = { textAlign: 'center' as const, marginBottom: '24px' }
const emoji = { fontSize: '48px', margin: '0 0 8px', lineHeight: '1' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: 'hsl(220, 30%, 15%)', margin: '0 0 8px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: 'hsl(220, 15%, 45%)', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: 'hsl(221, 83%, 53%)', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: 'hsl(220, 15%, 85%)', margin: '24px 0' }
const footer = { fontSize: '13px', color: 'hsl(220, 15%, 60%)', margin: '24px 0 0', textAlign: 'center' as const }
