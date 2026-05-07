import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, LogIn, LogOut, KeyRound, ShieldCheck, ShieldOff, RefreshCw, Download, Trash2, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

type AuditRow = {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const EVENT_LABELS: Record<string, { label: string; icon: any; tone: string }> = {
  login: { label: 'Login realizado', icon: LogIn, tone: 'text-emerald-500' },
  logout: { label: 'Logout', icon: LogOut, tone: 'text-muted-foreground' },
  password_changed: { label: 'Senha alterada', icon: KeyRound, tone: 'text-amber-500' },
  password_reset_requested: { label: 'Recuperação de senha solicitada', icon: KeyRound, tone: 'text-amber-500' },
  mfa_enabled: { label: '2FA ativado', icon: ShieldCheck, tone: 'text-emerald-500' },
  mfa_disabled: { label: '2FA desativado', icon: ShieldOff, tone: 'text-rose-500' },
  mfa_backup_codes_generated: { label: 'Códigos de backup gerados', icon: RefreshCw, tone: 'text-primary' },
  mfa_backup_codes_used: { label: 'Código de backup usado', icon: ShieldAlert, tone: 'text-amber-500' },
  session_revoked: { label: 'Sessões encerradas', icon: Smartphone, tone: 'text-rose-500' },
  data_exported: { label: 'Dados exportados', icon: Download, tone: 'text-primary' },
  account_deleted: { label: 'Conta excluída', icon: Trash2, tone: 'text-rose-500' },
};

function shortUA(ua: string | null) {
  if (!ua) return 'Dispositivo desconhecido';
  const isMobile = /Mobi|Android|iPhone|iPad/.test(ua);
  let browser = 'Navegador';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  let os = '';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  return `${browser} • ${os || (isMobile ? 'Mobile' : 'Desktop')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function SecurityActivity() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('id,event_type,ip_address,user_agent,metadata,created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setRows((data as AuditRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex items-start gap-2.5 mb-3">
        <ShieldAlert className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div className="flex-1">
          <h3 className="font-bold">Atividade de segurança</h3>
          <p className="text-muted-foreground text-sm">Histórico recente de logins, alterações de senha e 2FA</p>
        </div>
        <button onClick={load} className="glass-panel rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
          <RefreshCw className="size-3.5" /> Atualizar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-auto pr-1">
          {rows.map((r, i) => {
            const meta = EVENT_LABELS[r.event_type] || { label: r.event_type, icon: ShieldAlert, tone: 'text-muted-foreground' };
            const Icon = meta.icon;
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-2xl border border-border/40 bg-card/40 p-3 flex items-start gap-3"
              >
                <Icon className={`size-4 mt-0.5 ${meta.tone}`} strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{meta.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {shortUA(r.user_agent)} • {formatDate(r.created_at)}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
