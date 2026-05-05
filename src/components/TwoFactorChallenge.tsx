import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TwoFactorChallenge({ onSuccess, onCancel }: Props) {
  const [factorId, setFactorId] = useState<string>('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
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
