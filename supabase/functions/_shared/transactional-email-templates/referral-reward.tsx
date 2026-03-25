import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Conta Clara Lite"

interface ReferralRewardProps {
  referrerName?: string
}

const ReferralRewardEmail = ({ referrerName }: ReferralRewardProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Parabéns! Você ganhou 1 mês grátis no {SITE_NAME} 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={heroSection}>
          <Text style={emoji}>🎉</Text>
          <Heading style={h1}>
            {referrerName ? `Parabéns, ${referrerName}!` : 'Parabéns!'}
          </Heading>
        </Section>

        <Text style={text}>
          Uma pessoa que você indicou acabou de assinar o <strong>{SITE_NAME}</strong>!
          Como recompensa, você ganhou <strong>1 mês grátis</strong> na sua assinatura.
        </Text>

        <Text style={text}>
          O desconto já foi aplicado automaticamente e será refletido no próximo ciclo de cobrança.
        </Text>

        <Hr style={hr} />

        <Text style={text}>
          Continue indicando amigos e ganhe mais meses grátis! Cada amigo que assinar garante mais 1 mês para você.
        </Text>

        <Text style={footer}>
          Obrigado por fazer parte do {SITE_NAME}!
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReferralRewardEmail,
  subject: '🎉 Você ganhou 1 mês grátis!',
  displayName: 'Recompensa de indicação',
  previewData: { referrerName: 'João' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '520px', margin: '0 auto' }
const heroSection = { textAlign: 'center' as const, marginBottom: '24px' }
const emoji = { fontSize: '48px', margin: '0 0 8px', lineHeight: '1' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: 'hsl(220, 30%, 15%)', margin: '0 0 8px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: 'hsl(220, 15%, 45%)', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: 'hsl(220, 15%, 85%)', margin: '24px 0' }
const footer = { fontSize: '13px', color: 'hsl(220, 15%, 60%)', margin: '24px 0 0', textAlign: 'center' as const }
