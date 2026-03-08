import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Trash2, UserPlus, RefreshCw, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  user_name: string;
  roles: string[];
}

export default function AdminView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: null,
        method: 'GET',
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${email}? Esta ação é irreversível.`)) return;
    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-users?action=delete', {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        body: { user_id: userId },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success(`${email} removido com sucesso`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (userId: string, role: string) => {
    setActionLoading(`${userId}-${role}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-users?action=toggle-role', {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        body: { user_id: userId, role },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success('Papel atualizado');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Usuários Cadastrados ({users.length})</h3>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 glass-panel rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuário</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">E-mail</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cadastro</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Último acesso</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Papéis</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{u.user_name || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.last_sign_in_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {u.roles.length > 0 ? u.roles.map(r => (
                      <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        r === 'admin' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {r === 'admin' && <Crown className="w-3 h-3" />}
                        {r}
                      </span>
                    )) : (
                      <span className="text-xs text-muted-foreground">usuário</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => handleToggleRole(u.id, 'admin')}
                      disabled={actionLoading === `${u.id}-admin`}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        u.roles.includes('admin')
                          ? 'bg-primary/15 text-primary hover:bg-primary/25'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                      title={u.roles.includes('admin') ? 'Remover admin' : 'Tornar admin'}
                    >
                      <Crown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.email || '')}
                      disabled={actionLoading === u.id}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer transition-colors"
                      title="Excluir usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {users.map(u => (
          <div key={u.id} className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{u.user_name || '—'}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex gap-1.5">
                {u.roles.map(r => (
                  <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    r === 'admin' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {r === 'admin' && <Crown className="w-3 h-3" />}
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Cadastro: {formatDate(u.created_at)}</span>
              <span>Último: {formatDate(u.last_sign_in_at)}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleToggleRole(u.id, 'admin')}
                disabled={actionLoading === `${u.id}-admin`}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  u.roles.includes('admin')
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                {u.roles.includes('admin') ? 'Remover Admin' : 'Tornar Admin'}
              </button>
              <button
                onClick={() => handleDelete(u.id, u.email || '')}
                disabled={actionLoading === u.id}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-destructive/10 text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
