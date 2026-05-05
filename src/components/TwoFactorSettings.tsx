import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ShieldOff, KeyRound, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

type Factor = { id: string; status: string; friendly_name?: string | null };

export default function TwoFactorSettings() {
  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find(f => f.status === 'verified') || null;
    setFactor(verified as Factor | null);
    // clean up any leftover unverified factor
    const unverified = data?.totp?.find(f => (f.status as string) === 'unverified');
    if (unverified && !pendingFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: unverified.id });
    }
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function startEnroll() {
    setEnrolling(true);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Conta Clara ${Date.now()}`,
      });
      if (error) throw error;
      setPendingFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (e: any) {
      toast.error('Falha ao iniciar 2FA: ' + (e.message || ''));
      setEnrolling(false);
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnroll() {
    if (!pendingFactorId || code.length < 6) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: pendingFactorId,
        code: code.trim(),
      });
      if (error) throw error;
      toast.success('2FA ativado com sucesso!');
      setEnrolling(false);
      setPendingFactorId(null);
      setQr(''); setSecret(''); setCode('');
      await refresh();
    } catch (e: any) {
      toast.error('Código inválido. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnroll() {
    if (pendingFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: pendingFactorId });
    }
    setEnrolling(false);
    setPendingFactorId(null);
    setQr(''); setSecret(''); setCode('');
  }

  async function disable() {
    if (!factor) return;
    if (!confirm('Desativar a verificação em duas etapas? Sua conta ficará menos protegida.')) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) throw error;
      toast.success('2FA desativado.');
      await refresh();
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex items-start gap-2.5 mb-3">
        <KeyRound className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <h3 className="font-bold">Verificação em duas etapas (2FA)</h3>
          <p className="text-muted-foreground text-sm">
            Aumente a segurança exigindo um código do aplicativo autenticador no login.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando...</div>
      ) : factor ? (
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" strokeWidth={1.5} />
            <div>
              <div className="text-sm font-semibold text-primary">2FA ativado</div>
              <div className="text-xs text-muted-foreground">Sua conta está protegida com código TOTP.</div>
            </div>
          </div>
          <button onClick={disable} disabled={busy} className="badge-bad cursor-pointer px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
            <ShieldOff className="size-3.5" /> Desativar
          </button>
        </div>
      ) : !enrolling ? (
        <button onClick={startEnroll} disabled={busy} className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5 disabled:opacity-50">
          <ShieldCheck className="size-4" strokeWidth={1.5} /> Ativar 2FA
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            1) Escaneie o QR Code com Google Authenticator, Authy, 1Password ou similar.
            <br />2) Digite o código de 6 dígitos gerado para confirmar.
          </p>
          {qr && (
            <div className="flex justify-center p-4 rounded-xl bg-white border border-border">
              <img src={qr} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
          )}
          {secret && (
            <div className="text-xs text-muted-foreground text-center">
              Ou digite manualmente: <code className="px-2 py-1 rounded bg-accent text-foreground font-mono select-all">{secret}</code>
            </div>
          )}
          <div>
            <label className="text-xs font-medium mb-1 block">Código de 6 dígitos</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-foreground text-lg tracking-widest text-center outline-none font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={verifyEnroll} disabled={busy || code.length < 6} className="flex-1 brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Check className="size-4" /> Confirmar e ativar
            </button>
            <button onClick={cancelEnroll} disabled={busy} className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm flex items-center gap-1.5 disabled:opacity-50">
              <X className="size-4" /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
