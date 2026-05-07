import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, LogOut, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { logAuditEvent } from '@/lib/auditLog';

export default function ActiveSessions() {
  const [busy, setBusy] = useState<'others' | 'all' | null>(null);

  async function revoke(scope: 'others' | 'global') {
    if (!window.confirm(
      scope === 'others'
        ? 'Encerrar sessão em todos os outros dispositivos? Você continuará logado aqui.'
        : 'Encerrar TODAS as sessões (incluindo este dispositivo)? Você precisará entrar novamente.'
    )) return;

    setBusy(scope === 'others' ? 'others' : 'all');
    try {
      await logAuditEvent('session_revoked', { scope });
      const { error } = await supabase.auth.signOut({ scope: scope as any });
      if (error) throw error;
      toast.success(scope === 'others' ? 'Outras sessões encerradas.' : 'Saindo…');
      if (scope === 'global') {
        setTimeout(() => { window.location.href = '/'; }, 600);
      }
    } catch (e: any) {
      toast.error('Falha: ' + (e.message || 'erro desconhecido'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex items-start gap-2.5 mb-3">
        <Smartphone className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <h3 className="font-bold">Sessões ativas</h3>
          <p className="text-muted-foreground text-sm">
            Por segurança, encerre sessões em dispositivos que você não reconhece. O histórico completo de logins fica no painel acima.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2 mb-3">
        <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Esta ação invalida tokens em outros navegadores/celulares. Use se suspeitar de acesso não autorizado.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => revoke('others')}
          disabled={busy !== null}
          className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          {busy === 'others' ? 'Encerrando…' : 'Encerrar outras sessões'}
        </button>
        <button
          onClick={() => revoke('global')}
          disabled={busy !== null}
          className="bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          {busy === 'all' ? 'Encerrando…' : 'Encerrar TODAS as sessões'}
        </button>
      </div>
    </div>
  );
}
