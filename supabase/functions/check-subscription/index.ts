import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin — admins get full access
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (roles && roles.length > 0) {
      logStep("User is admin, granting full access");
      // Clear any retention tracking for admins
      await supabaseClient.from("profiles").update({
        subscription_ended_at: null,
        data_deletion_notified: false,
      }).eq("id", user.id);

      return new Response(JSON.stringify({
        subscribed: true,
        is_admin: true,
        trial_active: false,
        trial_days_left: 0,
        subscription_end: null,
        data_retention_days_left: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate trial status based on account creation
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const trialActive = diffDays <= 3;
    const trialDaysLeft = trialActive ? Math.max(0, Math.ceil(3 - diffDays)) : 0;
    logStep("Trial check", { diffDays, trialActive, trialDaysLeft });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    let hasActiveSub = false;
    let subscriptionEnd = null;

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      hasActiveSub = subscriptions.data.length > 0;

      if (hasActiveSub) {
        const subscription = subscriptions.data[0];
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        logStep("Active subscription found", { subscriptionId: subscription.id });
      } else {
        logStep("No active subscription found");
      }
    } else {
      logStep("No Stripe customer found");
    }

    const hasAccess = hasActiveSub || trialActive;

    // Track subscription_ended_at for data retention policy
    if (hasAccess) {
      // User has access — clear any retention tracking
      await supabaseClient.from("profiles").update({
        subscription_ended_at: null,
        data_deletion_notified: false,
      }).eq("id", user.id);
    } else {
      // User lost access — set subscription_ended_at if not already set
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("subscription_ended_at")
        .eq("id", user.id)
        .single();

      if (!profile?.subscription_ended_at) {
        await supabaseClient.from("profiles").update({
          subscription_ended_at: new Date().toISOString(),
        }).eq("id", user.id);
        logStep("Marked subscription_ended_at for data retention");
      }
    }

    // Calculate data retention days left
    let dataRetentionDaysLeft: number | null = null;
    if (!hasAccess) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("subscription_ended_at")
        .eq("id", user.id)
        .single();

      if (profile?.subscription_ended_at) {
        const endedAt = new Date(profile.subscription_ended_at);
        const daysSinceEnd = (now.getTime() - endedAt.getTime()) / (1000 * 60 * 60 * 24);
        dataRetentionDaysLeft = Math.max(0, Math.ceil(15 - daysSinceEnd));
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionEnd,
      trial_active: trialActive,
      trial_days_left: trialDaysLeft,
      data_retention_days_left: dataRetentionDaysLeft,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
