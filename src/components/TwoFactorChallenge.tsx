import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, LogIn, Loader2, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';
import { trustDevice } from '@/lib/trustedDevices';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TwoFactorChallenge({ onSuccess, onCancel }: Props) {
  const [factorId, setFactorId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        toast.error('Erro ao buscar fatores 2FA');
        onCancel();
        return;
      }
      const verified = data?.totp?.find(f => f.status === 'verified');
      if (!verified) {
        onSuccess();
        return;
      }
      setFactorId(verified.id);
      setLoading(false);
    })();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });
      if (error) throw error;
      if (remember && userId) trustDevice(userId);
      onSuccess();
    } catch (e: any) {
      toast.error('Código inválido. Tente novamente.');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    await supabase.auth.signOut();
    onCancel();
  }

  if (showRecovery) {
    return (
      <RecoveryInline
        onCancel={() => setShowRecovery(false)}
        onRecovered={async () => {
          // Backup code consumed → factor was unenrolled server-side.
          // Sign out so user logs in fresh without MFA challenge.
          await supabase.auth.signOut();
          toast.success('2FA desativado. Faça login novamente para reconfigurar.');
          onCancel();
        }}
      />
    );
  }

  return (
    <section className="min-h-screen grid place-items-center p-4">
      <div className="glass-panel p-6 md:p-8 max-w-md w-full">
        <div className="flex items-center gap-2.5 mb-4">
          <KeyRound className="size-6 text-primary" strokeWidth={1.5} />
          <div>
            <h2 className="text-lg md:text-xl font-bold">Verificação em duas etapas</h2>
            <p className="text-muted-foreground text-xs md:text-sm">Digite o código do seu aplicativo autenticador.</p>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando...</div>
        ) : (
          <form onSubmit={verify} className="grid gap-3">
            <input
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground text-2xl tracking-widest text-center outline-none font-mono focus:ring-2 focus:ring-ring transition-all"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="size-4 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-muted-foreground">Confiar neste dispositivo por 30 dias</span>
            </label>
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="brand-gradient border-none rounded-2xl px-4 py-3 font-bold cursor-pointer text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Verificar e entrar
            </button>
            <button
              type="button"
              onClick={() => setShowRecovery(true)}
              className="text-xs text-primary hover:underline bg-transparent border-none cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LifeBuoy className="size-3.5" /> Perdeu o acesso? Use um código de recuperação
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-xs text-muted-foreground hover:text-foreground underline bg-transparent border-none cursor-pointer"
            >
              Cancelar e sair
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function RecoveryInline({ onCancel, onRecovered }: { onCancel: () => void; onRecovered: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('mfa-backup-codes?action=recover', {
        body: { code: code.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      onRecovered();
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || 'código inválido'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-h-screen grid place-items-center p-4">
      <div className="glass-panel p-6 md:p-8 max-w-md w-full">
        <div className="flex items-center gap-2.5 mb-4">
          <LifeBuoy className="size-6 text-primary" strokeWidth={1.5} />
          <div>
            <h2 className="text-lg md:text-xl font-bold">Recuperar acesso</h2>
            <p className="text-muted-foreground text-xs md:text-sm">Use um dos seus códigos de recuperação. Ele desativará o 2FA atual; você poderá reconfigurar depois.</p>
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <input
            autoFocus
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 11))}
            placeholder="XXXXX-XXXXX"
            className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground text-lg tracking-widest text-center outline-none font-mono"
          />
          <button type="submit" disabled={busy || !code.trim()} className="brand-gradient border-none rounded-2xl px-4 py-3 font-bold cursor-pointer text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Confirmar e desativar 2FA
          </button>
          <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground underline bg-transparent border-none cursor-pointer">
            Voltar
          </button>
        </form>
      </div>
    </section>
  );
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
