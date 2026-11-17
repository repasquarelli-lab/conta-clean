import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to check role
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    if (action === "list") {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 100 });
      if (error) throw error;

      // Get roles and profiles
      const { data: roles } = await adminClient.from("user_roles").select("*");
      const { data: profiles } = await adminClient.from("profiles").select("*");

      const enrichedUsers = users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        user_name: profiles?.find((p) => p.id === u.id)?.user_name || "",
        roles: roles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [],
      }));

      return new Response(JSON.stringify({ users: enrichedUsers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "billing") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY missing");
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const subs: any[] = [];
      for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100, expand: ["data.customer"] })) {
        subs.push(sub);
        if (subs.length >= 500) break;
      }
      const charges = await stripe.charges.list({ limit: 100, expand: ["data.customer"] });
      const emailOf = (c: any) => (c && typeof c === "object" && !c.deleted ? c.email : null);
      const subscriptions = subs.map((s) => {
        const item = s.items?.data?.[0];
        const price = item?.price;
        return {
          id: s.id,
          email: emailOf(s.customer),
          status: s.status,
          interval: price?.recurring?.interval ?? null,
          amount: (price?.unit_amount ?? 0) / 100,
          currency: price?.currency ?? "brl",
          created: s.created,
          trial_end: s.trial_end,
          current_period_end: item?.current_period_end ?? null,
          cancel_at_period_end: s.cancel_at_period_end,
          canceled_at: s.canceled_at,
        };
      });
      const chargeList = charges.data.map((c: any) => ({
        id: c.id,
        email: emailOf(c.customer) || c.billing_details?.email || c.receipt_email || null,
        amount: c.amount / 100,
        refunded: c.amount_refunded / 100,
        currency: c.currency,
        status: c.status,
        paid: c.paid,
        failure_message: c.failure_message,
        created: c.created,
        receipt_url: c.receipt_url,
      }));
      return new Response(JSON.stringify({ subscriptions, charges: chargeList }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const body = await req.json();
      const targetId = body.user_id;
      if (targetId === user.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.deleteUser(targetId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle-role") {
      const body = await req.json();
      const { user_id: targetId, role } = body;
      
      const { data: existing } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", targetId)
        .eq("role", role)
        .maybeSingle();

      if (existing) {
        if (targetId === user.id && role === "admin") {
          return new Response(JSON.stringify({ error: "Cannot remove your own admin role" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await adminClient.from("user_roles").delete().eq("id", existing.id);
      } else {
        await adminClient.from("user_roles").insert({ user_id: targetId, role });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-users error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
