import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ShieldOff, KeyRound, Loader2, Check, X, Download, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { trustExpiresAt, untrustDevice } from '@/lib/trustedDevices';

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
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [trustExpiry, setTrustExpiry] = useState<number | null>(null);

  async function refresh() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setTrustExpiry(trustExpiresAt(user.id));
    }
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find(f => f.status === 'verified') || null;
    setFactor(verified as Factor | null);
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

  async function generateBackupCodes() {
    const { data, error } = await supabase.functions.invoke('mfa-backup-codes?action=generate');
    if (error || (data as any)?.error) {
      toast.error('Falha ao gerar códigos: ' + (error?.message || (data as any)?.error || ''));
      return null;
    }
    return (data as any).codes as string[];
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
      toast.success('2FA ativado!');
      const codes = await generateBackupCodes();
      if (codes) setBackupCodes(codes);
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
      if (userId) untrustDevice(userId);
      toast.success('2FA desativado.');
      setBackupCodes(null);
      await refresh();
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || ''));
    } finally {
      setBusy(false);
    }
  }

  async function regenerateCodes() {
    if (!confirm('Gerar novos códigos? Os códigos antigos deixarão de funcionar.')) return;
    setBusy(true);
    const codes = await generateBackupCodes();
    if (codes) {
      setBackupCodes(codes);
      toast.success('Novos códigos gerados.');
    }
    setBusy(false);
  }

  function downloadCodes() {
    if (!backupCodes) return;
    const txt = `Conta Clara — Códigos de recuperação 2FA\nGerado em: ${new Date().toLocaleString('pt-BR')}\n\n` +
      backupCodes.map((c, i) => `${String(i + 1).padStart(2, '0')}. ${c}`).join('\n') +
      `\n\nGuarde em local seguro. Cada código só pode ser usado uma vez.`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'conta-clara-codigos-recuperacao.txt'; a.click();
    URL.revokeObjectURL(url);
  }

  function untrustThisDevice() {
    if (!userId) return;
    untrustDevice(userId);
    setTrustExpiry(null);
    toast.success('Dispositivo removido. Será necessário 2FA no próximo acesso.');
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
        <div className="flex flex-col gap-3">
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

          <button onClick={regenerateCodes} disabled={busy} className="glass-panel rounded-2xl px-3 py-2 font-bold cursor-pointer text-xs flex items-center gap-1.5 self-start disabled:opacity-50">
            <RefreshCw className="size-3.5" /> Gerar novos códigos de recuperação
          </button>

          {trustExpiry && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-accent border border-border">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-muted-foreground" strokeWidth={1.5} />
                <div className="text-xs">
                  <div className="font-medium">Dispositivo confiável</div>
                  <div className="text-muted-foreground">Expira em {new Date(trustExpiry).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
              <button onClick={untrustThisDevice} className="text-xs underline text-destructive bg-transparent border-none cursor-pointer">
                Remover
              </button>
            </div>
          )}
        </div>
      ) : !enrolling ? (
        <button onClick={startEnroll} disabled={busy} className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5 disabled:opacity-50">
          <ShieldCheck className="size-4" strokeWidth={1.5} /> Ativar 2FA
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            1) Escaneie o QR Code com Google Authenticator, Authy, 1Password ou similar.
            <br />2) Digite o código de 6 dígitos para confirmar.
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

      {backupCodes && (
        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-bold text-sm">Seus códigos de recuperação</h4>
              <p className="text-xs text-muted-foreground">Guarde-os em local seguro. Cada código só funciona uma vez. Use-os se perder o aplicativo autenticador.</p>
            </div>
            <button onClick={() => setBackupCodes(null)} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 my-3">
            {backupCodes.map((c, i) => (
              <code key={i} className="px-2 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-center select-all">
                {c}
              </code>
            ))}
          </div>
          <button onClick={downloadCodes} className="brand-gradient border-none rounded-2xl px-3 py-2 font-bold cursor-pointer text-xs text-primary-foreground flex items-center gap-1.5">
            <Download className="size-3.5" /> Baixar como .txt
          </button>
        </div>
      )}
    </div>
  );
}
