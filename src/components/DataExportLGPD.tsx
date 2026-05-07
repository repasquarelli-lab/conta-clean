import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import { logAuditEvent } from '@/lib/auditLog';

const TABLES = [
  'profiles',
  'entries',
  'fixed_bills',
  'budget_goals',
  'credit_cards',
  'family_shares',
  'audit_logs',
  'referrals',
] as const;

export default function DataExportLGPD() {
  const [loading, setLoading] = useState(false);

  async function exportAll() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada');

      const payload: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email, createdAt: user.created_at },
      };

      for (const t of TABLES) {
        const { data, error } = await supabase.from(t as any).select('*');
        if (error) {
          payload[t] = { error: error.message };
        } else {
          payload[t] = data || [];
        }
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conta-clara-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await logAuditEvent('data_exported', { format: 'json' });
      toast.success('Seus dados foram exportados em JSON.');
    } catch (e: any) {
      toast.error('Erro ao exportar: ' + (e.message || 'desconhecido'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex items-start gap-2.5 mb-3">
        <FileJson className="size-5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <h3 className="font-bold">Exportar todos os meus dados (LGPD)</h3>
          <p className="text-muted-foreground text-sm">
            Baixe um arquivo JSON único com tudo que armazenamos sobre você: perfil, lançamentos, contas fixas, metas, cartões, compartilhamentos e auditoria.
          </p>
        </div>
      </div>
      <button
        onClick={exportAll}
        disabled={loading}
        className="glass-panel rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm flex items-center gap-1.5 disabled:opacity-50"
      >
        <Download className="size-4" strokeWidth={1.5} />
        {loading ? 'Gerando arquivo…' : 'Baixar meus dados (JSON)'}
      </button>
    </div>
  );
}
