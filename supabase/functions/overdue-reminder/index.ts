import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { isServiceRole } from "../_shared/auth.ts";

// Daily cron. Emails each user once about fixed bills that became overdue yesterday (unpaid).
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

Deno.serve(async (req) => {
  if (!isServiceRole(req)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // "Yesterday" in Brasília time
  const br = new Date(Date.now() - 3 * 3600_000);
  br.setUTCDate(br.getUTCDate() - 1);
  const yesterday = br.toISOString().slice(0, 10);

  const { data: rows, error } = await supabase
    .from("entries").select("user_id, description, value, date")
    .eq("type", "expense").eq("source_fixed", true).eq("paid", false).eq("date", yesterday).limit(5000);
  if (error) {
    console.error("query failed", error.message);
    return new Response(JSON.stringify({ error: "query failed" }), { status: 500 });
  }

  const byUser = new Map<string, typeof rows>();
  for (const r of rows || []) byUser.set(r.user_id, [...(byUser.get(r.user_id) || []), r]);

  let sent = 0;
  for (const [userId, bills] of byUser) {
    try {
      const { data: hasAccess } = await supabase.rpc("has_app_access", { _user_id: userId });
      if (!hasAccess) continue;
      const { data: prof } = await supabase.from("profiles").select("user_name, notification_settings").eq("id", userId).maybeSingle();
      const ns = (prof?.notification_settings || {}) as Record<string, unknown>;
      if (ns.enabled === false || ns.overdueAlert === false) continue;
      const { data: u } = await supabase.auth.admin.getUserById(userId);
      const email = u?.user?.email;
      if (!email) continue;
      const [, m, d] = yesterday.split("-");
      const total = bills!.reduce((s, b) => s + Number(b.value || 0), 0);
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "bills-overdue",
          recipientEmail: email,
          idempotencyKey: `bills-overdue-${userId}-${yesterday}`,
          templateData: {
            userName: prof?.user_name || undefined,
            bills: bills!.slice(0, 10).map((b) => ({ name: b.description || "Conta fixa", value: brl(Number(b.value || 0)), date: `${d}/${m}` })),
            total: brl(total),
          },
        },
      });
      sent++;
    } catch (e) {
      console.error("overdue reminder failed", { userId, error: (e as Error).message });
    }
  }
  console.log("overdue-reminder done", { sent, date: yesterday });
  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
