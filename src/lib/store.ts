export interface FixedBill {
  id: string;
  name: string;
  value: number;
  day: number;
  category: string;
}

export interface BudgetGoal {
  category: string;
  limit: number;
}

export interface Entry {
  id: string;
  type: 'income' | 'expense';
  desc: string;
  value: number;
  date: string;
  category: string;
  paid: boolean;
  recurring: boolean;
  sourceFixed?: boolean;
}

export interface AppState {
  brandName: string;
  userName: string;
  fixedBills: FixedBill[];
  entries: Entry[];
  budgetGoals?: BudgetGoal[];
}

const STORAGE_KEY = 'conta_clara_lite_v3';

export const categories = ['Casa', 'Mercado', 'Saúde', 'Transporte', 'Beleza', 'Lazer', 'Filhos', 'Assinaturas', 'Outros'];
export const incomeCategories = ['Salário', 'Aposentadoria', 'Comissão', 'Extra', 'Outros'];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function todayISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function currency(v: number): string {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function daysDiff(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function makeDemoData(): AppState {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const next = new Date(y, now.getMonth() + 1, 10);
  const nextY = next.getFullYear();
  const nextM = String(next.getMonth() + 1).padStart(2, '0');

  return {
    brandName: 'Conta Clara Lite',
    userName: 'Norma',
    fixedBills: [
      { id: uid(), name: 'Aluguel', value: 1800, day: 5, category: 'Casa' },
      { id: uid(), name: 'Energia', value: 210, day: 12, category: 'Casa' },
      { id: uid(), name: 'Água', value: 95, day: 10, category: 'Casa' },
      { id: uid(), name: 'Internet', value: 119, day: 8, category: 'Assinaturas' },
      { id: uid(), name: 'Plano de Saúde', value: 690, day: 15, category: 'Saúde' },
      { id: uid(), name: 'Salão / Beleza', value: 180, day: 22, category: 'Beleza' },
    ],
    entries: [
      { id: uid(), type: 'income', desc: 'Aposentadoria', value: 4200, date: `${y}-${m}-05`, category: 'Aposentadoria', paid: true, recurring: true },
      { id: uid(), type: 'income', desc: 'Extra de costura', value: 450, date: `${y}-${m}-14`, category: 'Extra', paid: true, recurring: false },
      { id: uid(), type: 'expense', desc: 'Mercado do mês', value: 760, date: `${y}-${m}-06`, category: 'Mercado', paid: true, recurring: false },
      { id: uid(), type: 'expense', desc: 'Farmácia', value: 130, date: `${y}-${m}-09`, category: 'Saúde', paid: true, recurring: false },
      { id: uid(), type: 'expense', desc: 'Transporte', value: 180, date: `${y}-${m}-11`, category: 'Transporte', paid: false, recurring: false },
      { id: uid(), type: 'expense', desc: 'Presente neta', value: 120, date: `${y}-${m}-25`, category: 'Outros', paid: false, recurring: false },
      { id: uid(), type: 'expense', desc: 'Aluguel', value: 1800, date: `${y}-${m}-05`, category: 'Casa', paid: true, recurring: true, sourceFixed: true },
      { id: uid(), type: 'expense', desc: 'Energia', value: 210, date: `${y}-${m}-12`, category: 'Casa', paid: false, recurring: true, sourceFixed: true },
      { id: uid(), type: 'expense', desc: 'Água', value: 95, date: `${y}-${m}-10`, category: 'Casa', paid: true, recurring: true, sourceFixed: true },
      { id: uid(), type: 'expense', desc: 'Internet', value: 119, date: `${y}-${m}-08`, category: 'Assinaturas', paid: true, recurring: true, sourceFixed: true },
      { id: uid(), type: 'expense', desc: 'Plano de Saúde', value: 690, date: `${y}-${m}-15`, category: 'Saúde', paid: false, recurring: true, sourceFixed: true },
      { id: uid(), type: 'expense', desc: 'Salão / Beleza', value: 180, date: `${y}-${m}-22`, category: 'Beleza', paid: false, recurring: true, sourceFixed: true },
      { id: uid(), type: 'expense', desc: 'Aluguel', value: 1800, date: `${nextY}-${nextM}-05`, category: 'Casa', paid: false, recurring: true, sourceFixed: true },
      { id: uid(), type: 'expense', desc: 'Energia', value: 215, date: `${nextY}-${nextM}-12`, category: 'Casa', paid: false, recurring: true, sourceFixed: true },
    ],
    budgetGoals: [
      { category: 'Casa', limit: 2500 },
      { category: 'Mercado', limit: 900 },
      { category: 'Saúde', limit: 1000 },
      { category: 'Transporte', limit: 300 },
      { category: 'Beleza', limit: 250 },
    ],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const demo = makeDemoData();
  saveState(demo);
  return demo;
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function ensureMonthFixedBills(state: AppState, month: string): AppState {
  const [year, mon] = month.split('-').map(Number);
  let changed = false;
  state.fixedBills.forEach(f => {
    const day = String(Math.min(f.day, 28)).padStart(2, '0');
    const date = `${year}-${String(mon).padStart(2, '0')}-${day}`;
    const exists = state.entries.some(e => e.type === 'expense' && e.sourceFixed && e.desc === f.name && e.date === date);
    if (!exists) {
      state.entries.push({ id: uid(), type: 'expense', desc: f.name, value: f.value, date, category: f.category, paid: false, recurring: true, sourceFixed: true });
      changed = true;
    }
  });
  if (changed) saveState(state);
  return state;
}

export function getMonthEntries(state: AppState, month: string): Entry[] {
  return state.entries.filter(e => e.date?.slice(0, 7) === month);
}

export interface MonthMetrics {
  entries: Entry[];
  incomes: number;
  expenses: number;
  open: number;
  paidExpenses: number;
  fixedExpenses: number;
  balance: number;
  free: number;
}

export function monthMetrics(state: AppState, month: string): MonthMetrics {
  const entries = getMonthEntries(state, month);
  const incomes = entries.filter(e => e.type === 'income').reduce((a, b) => a + Number(b.value || 0), 0);
  const expenses = entries.filter(e => e.type === 'expense').reduce((a, b) => a + Number(b.value || 0), 0);
  const open = entries.filter(e => e.type === 'expense' && !e.paid).reduce((a, b) => a + Number(b.value || 0), 0);
  const paidExpenses = entries.filter(e => e.type === 'expense' && e.paid).reduce((a, b) => a + Number(b.value || 0), 0);
  const fixedExpenses = entries.filter(e => e.type === 'expense' && e.recurring).reduce((a, b) => a + Number(b.value || 0), 0);
  return { entries, incomes, expenses, open, paidExpenses, fixedExpenses, balance: incomes - expenses, free: incomes - paidExpenses - open };
}

export function upcomingBills(state: AppState, days: number = 7) {
  const today = todayISO();
  return state.entries
    .filter(e => e.type === 'expense' && !e.paid)
    .map(e => ({ ...e, delta: daysDiff(today, e.date) }))
    .filter(e => e.delta >= 0 && e.delta <= days)
    .sort((a, b) => a.delta - b.delta);
}

export function overdueBills(state: AppState) {
  const today = todayISO();
  return state.entries.filter(e => e.type === 'expense' && !e.paid && e.date < today).sort((a, b) => a.date.localeCompare(b.date));
}

export function dueTodayBills(state: AppState) {
  const today = todayISO();
  return state.entries.filter(e => e.type === 'expense' && !e.paid && e.date === today);
}

export function topCategory(state: AppState, month: string): [string, number] | null {
  const map: Record<string, number> = {};
  getMonthEntries(state, month).filter(e => e.type === 'expense').forEach(e => {
    map[e.category] = (map[e.category] || 0) + Number(e.value || 0);
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return sorted[0] || null;
}

export function paidCount(state: AppState, month: string) {
  const exps = getMonthEntries(state, month).filter(e => e.type === 'expense');
  return { paid: exps.filter(e => e.paid).length, total: exps.length };
}
