import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { isServiceRole } from "../_shared/auth.ts";

// Runs once a day (cron). Emails every user whose 3-day trial ends within the next 24h.
// Window [now-72h, now-48h) on created_at means each user is picked up by exactly one daily run.
Deno.serve(async (req) => {
  if (!isServiceRole(req)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

  const now = Date.now();
  const from = now - 72 * 3600_000;
  const to = now - 48 * 3600_000;

  let page = 1;
  let sent = 0;
  const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  const adminIds = new Set((admins || []).map((a) => a.user_id));

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("listUsers error", error.message);
      break;
    }
    for (const u of data.users) {
      const created = new Date(u.created_at).getTime();
      if (created < from || created >= to || !u.email || adminIds.has(u.id)) continue;
      try {
        let willBeCharged = false;
        let amount = "R$ 14,90";
        let planLabel = "mensal";
        const customers = await stripe.customers.list({ email: u.email, limit: 1 });
        if (customers.data.length > 0) {
          const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "all", limit: 10 });
          if (subs.data.some((s) => s.status === "active")) continue; // already paying
          const trialing = subs.data.find((s) => s.status === "trialing");
          if (trialing) {
            willBeCharged = true;
            const price = trialing.items.data[0]?.price;
            if (price?.unit_amount) {
              amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: (price.currency || "brl").toUpperCase() }).format(price.unit_amount / 100);
            }
            if (price?.recurring?.interval === "year") planLabel = "anual";
          }
        }
        const { data: prof } = await supabase.from("profiles").select("user_name").eq("id", u.id).maybeSingle();
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "trial-ending",
            recipientEmail: u.email,
            idempotencyKey: `trial-ending-${u.id}`,
            templateData: { userName: prof?.user_name || undefined, willBeCharged, amount, planLabel },
          },
        });
        sent++;
      } catch (e) {
        console.error("trial reminder failed", { userId: u.id, error: (e as Error).message });
      }
    }
    if (data.users.length < 1000) break;
    page++;
  }

  console.log("trial-reminder done", { sent });
  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
