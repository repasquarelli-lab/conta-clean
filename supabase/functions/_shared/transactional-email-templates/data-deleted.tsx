/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

interface DataDeletedProps {
  userName?: string
}

export const DataDeletedEmail: React.FC<DataDeletedProps> = ({
  userName = 'Usuário',
}) => (
  <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto', padding: 24, background: '#ffffff' }}>
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, color: '#1a1a2e', margin: 0 }}>Seus dados foram removidos</h1>
    </div>
    <p style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
      Olá, <strong>{userName}</strong>.
    </p>
    <p style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
      Conforme avisado, seus dados financeiros no <strong>Conta Clara Lite</strong> foram removidos
      após 15 dias sem assinatura ativa.
    </p>
    <p style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
      Sua conta continua ativa. Se você assinar novamente, poderá começar a registrar novos dados imediatamente.
    </p>
    <div style={{ textAlign: 'center', margin: '24px 0' }}>
      <a
        href="https://appcontaclaralite.lovable.app"
        style={{
          display: 'inline-block',
          background: '#6c63ff',
          color: '#ffffff',
          padding: '12px 32px',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: 16,
        }}
      >
        Assinar novamente
      </a>
    </div>
    <p style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
      Obrigado por ter usado o Conta Clara Lite.
    </p>
  </div>
)

export const template = {
  component: DataDeletedEmail,
  subject: 'Seus dados foram removidos — Conta Clara Lite',
  displayName: 'Dados excluídos',
  previewData: { userName: 'Maria' },
}
