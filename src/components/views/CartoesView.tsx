import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { CreditCard as CardType, currency, getCardInvoice, formatDate, todayISO, uid } from '@/lib/store';
import MonthNavigator from '../MonthNavigator';
import { CreditCard, Plus, Trash2, Pencil, X, Save, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const BRANDS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Outro'];

export default function CartoesView() {
  const { state, updateState, currentMonth, setCurrentMonth } = useApp();
  const [editing, setEditing] = useState<CardType | null>(null);
  const [showForm, setShowForm] = useState(false);

  const cards = state.creditCards || [];

  const invoices = useMemo(
    () => cards.map(c => getCardInvoice(state, c.id, currentMonth)).filter(Boolean) as ReturnType<typeof getCardInvoice>[],
    [cards, state.entries, currentMonth]
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const card: CardType = {
      id: editing?.id || uid(),
      name: String(fd.get('name') || '').trim(),
      brand: String(fd.get('brand') || ''),
      last4: String(fd.get('last4') || '').replace(/\D/g, '').slice(0, 4),
      creditLimit: Number(fd.get('creditLimit') || 0),
      closingDay: Math.min(28, Math.max(1, Number(fd.get('closingDay') || 1))),
      dueDay: Math.min(28, Math.max(1, Number(fd.get('dueDay') || 10))),
      color: String(fd.get('color') || '#7c3aed'),
    };
    if (!card.name) { toast.error('Dê um apelido ao cartão.'); return; }
    updateState(prev => {
      const list = prev.creditCards || [];
      const next = editing
        ? list.map(c => c.id === card.id ? card : c)
        : [...list, card];
      return { ...prev, creditCards: next };
    });
    toast.success(editing ? 'Cartão atualizado!' : 'Cartão adicionado!');
    setEditing(null);
    setShowForm(false);
  }

  function deleteCard(id: string) {
    if (!confirm('Excluir este cartão? Os lançamentos vinculados ficarão sem cartão.')) return;
    updateState(prev => ({
      ...prev,
      creditCards: (prev.creditCards || []).filter(c => c.id !== id),
      entries: prev.entries.map(e => e.cardId === id ? { ...e, cardId: undefined } : e),
    }));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <MonthNavigator month={currentMonth} onChange={setCurrentMonth} />
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center gap-1.5"
        >
          <Plus className="size-4" /> Novo cartão
        </button>
      </div>

      {cards.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <CreditCard className="size-12 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-bold text-lg mb-1">Nenhum cartão cadastrado</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Adicione seus cartões de crédito para agrupar gastos por fatura e acompanhar o vencimento.
          </p>
          <button onClick={() => setShowForm(true)} className="brand-gradient border-none rounded-2xl px-5 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground inline-flex items-center gap-1.5">
            <Plus className="size-4" /> Cadastrar primeiro cartão
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {invoices.map(inv => inv && (
          <motion.div
            key={inv.cardId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4"
            style={{ borderTop: `4px solid ${inv.card.color || '#7c3aed'}` }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl flex items-center justify-center" style={{ background: inv.card.color || '#7c3aed' }}>
                  <CreditCard className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">{inv.card.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {inv.card.brand} {inv.card.last4 ? `•••• ${inv.card.last4}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(inv.card); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-accent cursor-pointer">
                  <Pencil className="size-4 text-muted-foreground" />
                </button>
                <button onClick={() => deleteCard(inv.cardId)} className="p-1.5 rounded-lg hover:bg-accent cursor-pointer">
                  <Trash2 className="size-4 text-destructive" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-3 rounded-xl bg-accent border border-border">
                <p className="text-[11px] text-muted-foreground">Fatura {inv.isClosed ? 'fechada' : 'aberta'}</p>
                <p className="text-lg font-extrabold">{currency(inv.total)}</p>
              </div>
              <div className="p-3 rounded-xl bg-accent border border-border">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Vence em</p>
                <p className="text-lg font-extrabold">{formatDate(inv.dueDate)}</p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mb-2">
              Período: {formatDate(inv.cycleStart)} → {formatDate(inv.cycleEnd)}
            </p>

            {inv.card.creditLimit > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Limite usado</span>
                  <span className="font-semibold">{Math.round((inv.total / inv.card.creditLimit) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-accent overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, (inv.total / inv.card.creditLimit) * 100)}%`,
                      background: inv.total > inv.card.creditLimit ? 'hsl(0 72% 51%)' : inv.card.color,
                    }}
                  />
                </div>
              </div>
            )}

            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                Ver {inv.entries.length} lançamento{inv.entries.length !== 1 ? 's' : ''}
              </summary>
              <ul className="mt-2 space-y-1.5 max-h-48 overflow-auto">
                {inv.entries.length === 0 && <li className="text-xs text-muted-foreground italic">Sem gastos no ciclo.</li>}
                {inv.entries.sort((a, b) => a.date.localeCompare(b.date)).map(e => (
                  <li key={e.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-accent/50">
                    <div className="truncate">
                      <span className="font-medium">{e.desc}</span>
                      <span className="text-muted-foreground ml-2">{formatDate(e.date)}</span>
                    </div>
                    <span className="font-bold whitespace-nowrap">{currency(e.value)}</span>
                  </li>
                ))}
              </ul>
            </details>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'hsla(var(--background) / 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => { setShowForm(false); setEditing(null); }}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmit}
              onClick={e => e.stopPropagation()}
              className="glass-panel p-5 w-full max-w-md rounded-2xl shadow-xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg">{editing ? 'Editar cartão' : 'Novo cartão'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="p-1.5 rounded-lg hover:bg-accent cursor-pointer">
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Apelido *</label>
                <input name="name" defaultValue={editing?.name} placeholder="Nubank Roxinho" required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Bandeira</label>
                  <select name="brand" defaultValue={editing?.brand || 'Visa'} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none">
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Final (4 dígitos)</label>
                  <input name="last4" defaultValue={editing?.last4} maxLength={4} inputMode="numeric" placeholder="1234" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Limite</label>
                  <input name="creditLimit" type="number" step="0.01" min="0" defaultValue={editing?.creditLimit || 0} className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Fechamento</label>
                  <input name="closingDay" type="number" min="1" max="28" defaultValue={editing?.closingDay || 1} required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Vencimento</label>
                  <input name="dueDay" type="number" min="1" max="28" defaultValue={editing?.dueDay || 10} required className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-input text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Cor</label>
                <input name="color" type="color" defaultValue={editing?.color || '#7c3aed'} className="w-full h-10 rounded-[14px] border border-border bg-input cursor-pointer" />
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-accent text-[11px] text-muted-foreground">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>O ciclo da fatura vai do dia seguinte ao fechamento até o próximo fechamento. Use dias 1–28 para evitar problemas com meses curtos.</span>
              </div>
              <button type="submit" className="brand-gradient border-none rounded-2xl px-4 py-2.5 font-bold cursor-pointer text-sm text-primary-foreground flex items-center justify-center gap-1.5">
                <Save className="size-4" /> {editing ? 'Salvar alterações' : 'Adicionar cartão'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
