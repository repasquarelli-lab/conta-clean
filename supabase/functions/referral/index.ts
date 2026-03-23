import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "get-or-create-code") {
      // Check if user already has a referral code
      const { data: existing } = await supabaseClient
        .from("referrals")
        .select("referral_code")
        .eq("referrer_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ code: existing[0].referral_code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a unique code
      const code = user.id.slice(0, 8).toUpperCase();
      const { error: insertError } = await supabaseClient
        .from("referrals")
        .insert({ referrer_id: user.id, referral_code: code });

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "track-referral") {
      const refCode = body.referral_code;
      if (!refCode) throw new Error("No referral code provided");

      // Find the referral
      const { data: referral } = await supabaseClient
        .from("referrals")
        .select("*")
        .eq("referral_code", refCode)
        .is("referred_id", null)
        .limit(1);

      if (!referral || referral.length === 0) {
        return new Response(JSON.stringify({ tracked: false, reason: "Invalid or already used code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Don't allow self-referral
      if (referral[0].referrer_id === user.id) {
        return new Response(JSON.stringify({ tracked: false, reason: "Cannot refer yourself" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update the referral with the referred user
      await supabaseClient
        .from("referrals")
        .update({ referred_id: user.id, status: "converted", converted_at: new Date().toISOString() })
        .eq("id", referral[0].id);

      return new Response(JSON.stringify({ tracked: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-stats") {
      const { data: referrals } = await supabaseClient
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id);

      const total = referrals?.length || 0;
      const converted = referrals?.filter(r => r.status === "converted").length || 0;
      const rewarded = referrals?.filter(r => r.reward_applied).length || 0;

      return new Response(JSON.stringify({ total, converted, rewarded }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
