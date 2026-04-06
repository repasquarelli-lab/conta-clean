/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

interface DataDeletionWarningProps {
  userName?: string
  daysLeft?: number
}

export const DataDeletionWarningEmail: React.FC<DataDeletionWarningProps> = ({
  userName = 'Usuário',
  daysLeft = 5,
}) => (
  <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto', padding: 24, background: '#ffffff' }}>
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, color: '#1a1a2e', margin: 0 }}>⚠️ Seus dados serão excluídos em breve</h1>
    </div>
    <p style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
      Olá, <strong>{userName}</strong>!
    </p>
    <p style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
      Sua assinatura do <strong>Conta Clara Lite</strong> expirou e seus dados financeiros serão{' '}
      <strong>excluídos permanentemente em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>.
    </p>
    <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: 16, margin: '20px 0' }}>
      <p style={{ margin: 0, fontSize: 14, color: '#856404' }}>
        📊 Todos os seus lançamentos, contas fixas, metas e categorias personalizadas serão removidos.
      </p>
    </div>
    <p style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
      Para manter seus dados, renove sua assinatura agora:
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
        Renovar assinatura
      </a>
    </div>
    <p style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
      Se tiver dúvidas, entre em contato com nosso suporte.
    </p>
  </div>
)

export const template = {
  component: DataDeletionWarningEmail,
  subject: (data: Record<string, any>) =>
    `⚠️ Seus dados serão excluídos em ${data.daysLeft || 5} dias — Conta Clara Lite`,
  displayName: 'Aviso de exclusão de dados',
  previewData: { userName: 'Maria', daysLeft: 5 },
}
