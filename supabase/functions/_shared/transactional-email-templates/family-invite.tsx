import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Conta Clara Lite"

interface FamilyInviteProps {
  ownerName?: string
  acceptUrl?: string
}

const FamilyInviteEmail = ({ ownerName, acceptUrl }: FamilyInviteProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{ownerName || 'Alguém'} convidou você para ver as finanças no {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={heroSection}>
          <Text style={emoji}>👨‍👩‍👧</Text>
          <Heading style={h1}>Você foi convidado!</Heading>
        </Section>

        <Text style={text}>
          <strong>{ownerName || 'Alguém'}</strong> convidou você para acompanhar
          as finanças no <strong>{SITE_NAME}</strong> em <strong>modo somente leitura</strong>.
        </Text>

        <Text style={text}>
          Você poderá visualizar lançamentos, contas e cartões — mas não fará
          alterações. É a forma mais simples de acompanhar as finanças da família.
        </Text>

        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={acceptUrl} style={btn}>
            Aceitar convite
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Se você não esperava esse convite, basta ignorar esta mensagem.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FamilyInviteEmail,
  subject: 'Você foi convidado para ver finanças no Conta Clara Lite',
  displayName: 'Convite de compartilhamento familiar',
  previewData: { ownerName: 'João', acceptUrl: 'https://appcontaclaralite.lovable.app' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '520px', margin: '0 auto' }
const heroSection = { textAlign: 'center' as const, marginBottom: '24px' }
const emoji = { fontSize: '48px', margin: '0 0 8px', lineHeight: '1' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: 'hsl(220, 30%, 15%)', margin: '0 0 8px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: 'hsl(220, 15%, 45%)', lineHeight: '1.6', margin: '0 0 16px' }
const btn = { backgroundColor: 'hsl(252, 83%, 60%)', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { borderColor: 'hsl(220, 15%, 85%)', margin: '24px 0' }
const footer = { fontSize: '13px', color: 'hsl(220, 15%, 60%)', margin: '24px 0 0', textAlign: 'center' as const }
