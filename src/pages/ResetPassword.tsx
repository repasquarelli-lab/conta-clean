import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setReady(true);
    } else {
      // Also listen for PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha atualizada com sucesso!');
      setTimeout(() => navigate('/'), 1500);
    }
  }

  if (!ready) {
    return (
      <section className="min-h-screen grid place-items-center p-4">
        <div className="glass-panel p-7 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-2xl grid place-items-center brand-gradient font-black tracking-wide text-primary-foreground mx-auto mb-4">CC</div>
          <h2 className="text-xl font-bold mb-2">Link inválido</h2>
          <p className="text-muted-foreground text-sm mb-4">Este link de redefinição de senha é inválido ou expirou.</p>
          <button onClick={() => navigate('/')} className="brand-gradient border-none rounded-2xl px-4 py-3 font-bold cursor-pointer text-primary-foreground text-sm">
            Voltar ao início
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen grid place-items-center p-4">
      <div className="glass-panel p-7 max-w-md w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl grid place-items-center brand-gradient font-black tracking-wide text-primary-foreground">CC</div>
          <div>
            <h1 className="text-base font-bold">Conta Clara Lite</h1>
            <p className="text-sm text-muted-foreground">Redefinir senha</p>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">Nova senha</h2>
        <p className="text-muted-foreground text-sm mb-5">Digite sua nova senha abaixo.</p>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
              minLength={6}
              className="w-full px-3 py-3 rounded-[14px] border border-border bg-input text-foreground outline-none placeholder:text-muted-foreground text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="brand-gradient border-none rounded-2xl px-4 py-3 font-bold cursor-pointer text-primary-foreground mt-2 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </section>
  );
}
