import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDataExport(userId: string | undefined) {
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return null;
    const [entriesRes, fixedRes, goalsRes] = await Promise.all([
      supabase.from('entries').select('*').eq('user_id', userId),
      supabase.from('fixed_bills').select('*').eq('user_id', userId),
      supabase.from('budget_goals').select('*').eq('user_id', userId),
    ]);
    return {
      entries: entriesRes.data || [],
      fixedBills: fixedRes.data || [],
      budgetGoals: goalsRes.data || [],
    };
  }, [userId]);

  const exportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const data = await fetchData();
      if (!data) throw new Error('Sem dados');

      const lines: string[] = [];

      // Entries
      lines.push('=== LANÇAMENTOS ===');
      lines.push('Tipo,Descrição,Valor,Data,Categoria,Pago,Recorrente');
      data.entries.forEach((e: any) => {
        lines.push(`${e.type === 'income' ? 'Receita' : 'Despesa'},"${e.description}",${e.value},${e.date},"${e.category}",${e.paid ? 'Sim' : 'Não'},${e.recurring ? 'Sim' : 'Não'}`);
      });

      lines.push('');
      lines.push('=== CONTAS FIXAS ===');
      lines.push('Nome,Valor,Dia,Categoria');
      data.fixedBills.forEach((f: any) => {
        lines.push(`"${f.name}",${f.value},${f.day},"${f.category}"`);
      });

      lines.push('');
      lines.push('=== METAS DE ORÇAMENTO ===');
      lines.push('Categoria,Limite');
      data.budgetGoals.forEach((g: any) => {
        lines.push(`"${g.category}",${g.limit}`);
      });

      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conta-clara-dados-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  }, [fetchData]);

  const exportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const data = await fetchData();
      if (!data) throw new Error('Sem dados');

      // Build a printable HTML document
      const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
      const today = new Date().toLocaleDateString('pt-BR');

      let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Dados Conta Clara Lite</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #6c63ff; font-size: 22px; border-bottom: 2px solid #6c63ff; padding-bottom: 8px; }
          h2 { color: #444; font-size: 16px; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
          th { background: #6c63ff; color: white; text-align: left; padding: 8px; }
          td { padding: 6px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          .meta { font-size: 12px; color: #888; margin-bottom: 20px; }
          .summary { background: #f0f0ff; padding: 12px; border-radius: 8px; margin: 16px 0; }
          .summary span { font-weight: bold; color: #6c63ff; }
        </style>
      </head><body>`;

      html += `<h1>📊 Relatório de Dados — Conta Clara Lite</h1>`;
      html += `<p class="meta">Exportado em ${today}</p>`;

      // Summary
      const totalIncome = data.entries.filter((e: any) => e.type === 'income').reduce((s: number, e: any) => s + Number(e.value), 0);
      const totalExpense = data.entries.filter((e: any) => e.type === 'expense').reduce((s: number, e: any) => s + Number(e.value), 0);
      html += `<div class="summary">
        <p>Total de lançamentos: <span>${data.entries.length}</span> | 
        Contas fixas: <span>${data.fixedBills.length}</span> | 
        Metas: <span>${data.budgetGoals.length}</span></p>
        <p>Receitas: <span style="color:green">${formatCurrency(totalIncome)}</span> | 
        Despesas: <span style="color:red">${formatCurrency(totalExpense)}</span> | 
        Saldo: <span>${formatCurrency(totalIncome - totalExpense)}</span></p>
      </div>`;

      // Entries table
      if (data.entries.length > 0) {
        html += `<h2>Lançamentos (${data.entries.length})</h2><table>
          <tr><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Data</th><th>Categoria</th><th>Pago</th></tr>`;
        data.entries.forEach((e: any) => {
          html += `<tr>
            <td>${e.type === 'income' ? '📈 Receita' : '📉 Despesa'}</td>
            <td>${e.description}</td>
            <td>${formatCurrency(Number(e.value))}</td>
            <td>${new Date(e.date).toLocaleDateString('pt-BR')}</td>
            <td>${e.category}</td>
            <td>${e.paid ? '✅' : '❌'}</td>
          </tr>`;
        });
        html += `</table>`;
      }

      // Fixed bills
      if (data.fixedBills.length > 0) {
        html += `<h2>Contas Fixas (${data.fixedBills.length})</h2><table>
          <tr><th>Nome</th><th>Valor</th><th>Dia</th><th>Categoria</th></tr>`;
        data.fixedBills.forEach((f: any) => {
          html += `<tr><td>${f.name}</td><td>${formatCurrency(Number(f.value))}</td><td>${f.day}</td><td>${f.category}</td></tr>`;
        });
        html += `</table>`;
      }

      // Budget goals
      if (data.budgetGoals.length > 0) {
        html += `<h2>Metas de Orçamento (${data.budgetGoals.length})</h2><table>
          <tr><th>Categoria</th><th>Limite</th></tr>`;
        data.budgetGoals.forEach((g: any) => {
          html += `<tr><td>${g.category}</td><td>${formatCurrency(Number(g.limit))}</td></tr>`;
        });
        html += `</table>`;
      }

      html += `</body></html>`;

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success('PDF pronto para impressão!');
    } catch (err) {
      console.error('Export PDF error:', err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  }, [fetchData]);

  return { exportCSV, exportPDF, exporting };
}
