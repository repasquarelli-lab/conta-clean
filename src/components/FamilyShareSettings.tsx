import { useEffect, useState } from 'react';
import { Users, Mail, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFamilyShare } from '@/hooks/useFamilyShare';
import { useApp } from '@/contexts/AppContext';

interface Share {
  id: string;
  invitee_email: string;
  status: string;
  created_at: string;
  accepted_at?: string | null;
}

interface SharedWithMe {
  id: string;
  owner_id: string;
  owner_name: string;
  status: string;
}

export default function FamilyShareSettings() {
  const fam = useFamilyShare();
  const { viewingAs, setViewingAs } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mine, setMine] = useState<Share[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMe[]>([]);

  async function reload() {
    try {
      const [m, s] = await Promise.all([fam.listMine(), fam.listSharedWithMe()]);
      setMine(m.shares || []);
      setSharedWithMe(s.shares || []);
    } catch (e: any) {
      console.error(e);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleInvite() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      toast.error('Informe um e-mail válido');
      return;
    }
    setLoading(true);
    try {
      await fam.invite(e);
      toast.success('Convite enviado por e-mail');
      setEmail('');
      reload();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao enviar convite');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revogar este compartilhamento?')) return;
    try {
      await fam.revoke(id);
      toast.success('Compartilhamento revogado');
      reload();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao revogar');
    }
  }

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex items-start gap-2.5 mb-3">
        <Users className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <h3 className="font-bold">Compartilhamento Familiar</h3>
          <p className="text-muted-foreground text-sm">
            Convide alguém para visualizar suas finanças em modo somente leitura.
          </p>
        </div>
      </div>

      {/* Invite */}
      <div className="flex gap-2 flex-wrap mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          className="flex-1 min-w-[200px] glass-panel rounded-2xl px-3 py-2.5 text-sm bg-background border border-border"
        />
        <button
          onClick={handleInvite}
          disabled={loading}
          className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" strokeWidth={1.5} />}
          Convidar
        </button>
      </div>

      {/* My invitations */}
      {mine.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Convites enviados
          </p>
          <div className="space-y-2">
            {mine.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 bg-background/50 rounded-xl p-3 border border-border">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.invitee_email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.status === 'accepted' ? '✅ Aceito' : '⏳ Aguardando aceite'}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(s.id)}
                  className="text-destructive p-2 rounded-lg hover:bg-destructive/10"
                  title="Revogar"
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared with me */}
      {sharedWithMe.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Compartilhado com você
          </p>
          <div className="space-y-2">
            {sharedWithMe.map((s) => {
              const isActive = viewingAs?.ownerId === s.owner_id;
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 bg-background/50 rounded-xl p-3 border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.owner_name}</p>
                    <p className="text-[11px] text-muted-foreground">Modo somente leitura</p>
                  </div>
                  {isActive ? (
                    <button
                      onClick={() => setViewingAs(null)}
                      className="glass-panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                    >
                      <EyeOff className="size-3.5" strokeWidth={1.5} /> Sair
                    </button>
                  ) : (
                    <button
                      onClick={() => setViewingAs({ ownerId: s.owner_id, ownerName: s.owner_name })}
                      className="brand-gradient border-none rounded-xl px-3 py-2 text-xs font-bold text-primary-foreground flex items-center gap-1.5"
                    >
                      <Eye className="size-3.5" strokeWidth={1.5} /> Visualizar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
