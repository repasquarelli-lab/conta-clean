import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICES: Record<string, string> = {
  monthly: "price_1TBbvgHqwRqk6Qz3rGgh6fJx",
  annual: "price_1TCPLiHqwRqk6Qz3Pdgk1dPZ",
};

const REFERRAL_COUPON_ID = "uJMk0Uma";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json().catch(() => ({}));
    const plan = body.plan || "monthly";
    const priceId = PRICES[plan];
    if (!priceId) throw new Error(`Invalid plan: ${plan}`);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Check if user was referred (has a converted referral where they are the referred_id)
    const { data: referral } = await supabaseClient
      .from("referrals")
      .select("id, reward_applied, referrer_id")
      .eq("referred_id", user.id)
      .eq("status", "converted")
      .eq("reward_applied", false)
      .limit(1);

    const hasReferralDiscount = referral && referral.length > 0;
    logStep("Referral check", { hasReferralDiscount, referralId: referral?.[0]?.id });

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/?subscription=canceled`,
    };

    // Apply referral coupon to the referred user if eligible
    if (hasReferralDiscount) {
      sessionParams.discounts = [{ coupon: REFERRAL_COUPON_ID }];
      logStep("Applying referral coupon to referred user", { couponId: REFERRAL_COUPON_ID });

      // Mark referral reward as applied
      await supabaseClient
        .from("referrals")
        .update({ reward_applied: true })
        .eq("id", referral![0].id);
      logStep("Referral reward marked as applied");

      // Reward the referrer: apply coupon to their active subscription
      try {
        const referrerId = referral![0].referrer_id;
        const { data: referrerUser } = await supabaseClient.auth.admin.getUserById(referrerId);
        const referrerEmail = referrerUser?.user?.email;

        if (referrerEmail) {
          const referrerCustomers = await stripe.customers.list({ email: referrerEmail, limit: 1 });
          if (referrerCustomers.data.length > 0) {
            const referrerCustomerId = referrerCustomers.data[0].id;
            const referrerSubs = await stripe.subscriptions.list({
              customer: referrerCustomerId,
              status: "active",
              limit: 1,
            });

            if (referrerSubs.data.length > 0) {
              // Apply the coupon to the referrer's active subscription
              await stripe.subscriptions.update(referrerSubs.data[0].id, {
                coupon: REFERRAL_COUPON_ID,
              });
              logStep("Referrer rewarded with free month", { referrerId, subscriptionId: referrerSubs.data[0].id });
            } else {
              logStep("Referrer has no active subscription to reward", { referrerId });
            }
          } else {
            logStep("Referrer has no Stripe customer", { referrerId });
          }
        }
      } catch (referrerErr) {
        // Don't block checkout if referrer reward fails
        logStep("Error rewarding referrer (non-blocking)", { error: referrerErr.message });
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
