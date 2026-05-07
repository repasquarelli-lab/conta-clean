import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function previousMonth(): { iso: string; label: string; start: string; end: string } {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const iso = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const label = prev.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const start = `${iso}-01`;
  const lastDay = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
  const end = `${iso}-${String(lastDay).padStart(2, "0")}`;
  return { iso, label, start, end };
}

async function aiSummary(metrics: any, monthLabel: string): Promise<string> {
  if (!LOVABLE_API_KEY) return "";
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um copiloto financeiro brasileiro. Em PT-BR, escreva 1-2 frases curtas, amigáveis e acionáveis (máx 220 chars) sobre o mês do usuário. Sem emojis, sem listas." },
          { role: "user", content: `Mês: ${monthLabel}. Receitas: ${fmtBRL(metrics.incomes)}. Despesas: ${fmtBRL(metrics.expenses)}. Saldo: ${fmtBRL(metrics.balance)}. Maior categoria: ${metrics.topCategory || '—'} (${fmtBRL(metrics.topCategoryValue || 0)}).` },
        ],
      }),
    });
    if (!r.ok) return "";
    const data = await r.json();
    return (data.choices?.[0]?.message?.content || "").toString().trim();
  } catch (e) {
    console.error("aiSummary error:", e);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { iso, label, start, end } = previousMonth();

  // Optional dry-run / single user via body
  let onlyUserId: string | undefined;
  try {
    const body = await req.json();
    onlyUserId = body?.userId;
  } catch { /* no-op */ }

  // Load profiles with notification_settings.enabled (default true)
  let profilesQ = supabase.from("profiles").select("id, user_name, notification_settings");
  if (onlyUserId) profilesQ = profilesQ.eq("id", onlyUserId);
  const { data: profiles, error: pErr } = await profilesQ;
  if (pErr) {
    console.error("profiles err:", pErr);
    return new Response(JSON.stringify({ error: pErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const results: any[] = [];

  for (const p of profiles || []) {
    const settings = (p.notification_settings as any) || {};
    if (settings.enabled === false || settings.monthlyReport === false) continue;

    // Get email
    const { data: u } = await supabase.auth.admin.getUserById(p.id);
    const email = u?.user?.email;
    if (!email) continue;

    // Load entries for previous month
    const { data: entries } = await supabase
      .from("entries")
      .select("type, value, paid, category, date")
      .eq("user_id", p.id)
      .gte("date", start)
      .lte("date", end);

    const list = entries || [];
    if (list.length === 0) {
      results.push({ user: p.id, skipped: "no-entries" });
      continue;
    }

    const incomes = list.filter(e => e.type === "income").reduce((s, e) => s + Number(e.value || 0), 0);
    const expenses = list.filter(e => e.type === "expense").reduce((s, e) => s + Number(e.value || 0), 0);
    const paidIncomes = list.filter(e => e.type === "income" && e.paid).reduce((s, e) => s + Number(e.value || 0), 0);
    const paidExpenses = list.filter(e => e.type === "expense" && e.paid).reduce((s, e) => s + Number(e.value || 0), 0);
    const paidCount = list.filter(e => e.paid).length;
    const pendingCount = list.filter(e => !e.paid).length;

    // Top expense category
    const catTotals: Record<string, number> = {};
    for (const e of list) {
      if (e.type !== "expense") continue;
      catTotals[e.category || "Outros"] = (catTotals[e.category || "Outros"] || 0) + Number(e.value || 0);
    }
    const topEntry = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topEntry?.[0];
    const topCategoryValue = topEntry?.[1];

    const balance = paidIncomes - paidExpenses;
    const summary = await aiSummary({ incomes, expenses, balance, topCategory, topCategoryValue }, label);

    const { error: eErr } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "monthly-report",
        recipientEmail: email,
        idempotencyKey: `monthly-report:${p.id}:${iso}`,
        templateData: {
          userName: p.user_name || "amigo(a)",
          monthLabel: label,
          incomes, expenses, balance,
          topCategory, topCategoryValue,
          paidCount, pendingCount,
          aiSummary: summary,
          appUrl: "https://appcontaclaralite.lovable.app",
        },
      },
    });
    results.push({ user: p.id, ok: !eErr, error: eErr?.message });
  }

  return new Response(JSON.stringify({ month: iso, processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
