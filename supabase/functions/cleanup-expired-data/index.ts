import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-EXPIRED-DATA] ${step}${detailsStr}`);
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
    const now = new Date();

    // Find users whose subscription ended and haven't been notified yet (10+ days)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();

    // Step 1: Notify users at 10+ days (who haven't been notified)
    const { data: usersToNotify } = await supabaseClient
      .from("profiles")
      .select("id, user_name, subscription_ended_at")
      .not("subscription_ended_at", "is", null)
      .lte("subscription_ended_at", tenDaysAgo)
      .eq("data_deletion_notified", false);

    if (usersToNotify && usersToNotify.length > 0) {
      logStep("Users to notify about data deletion", { count: usersToNotify.length });

      for (const profile of usersToNotify) {
        try {
          // Get user email from auth
          const { data: authUser } = await supabaseClient.auth.admin.getUserById(profile.id);
          const email = authUser?.user?.email;

          if (email) {
            // Send warning email
            await supabaseClient.functions.invoke("send-transactional-email", {
              body: {
                templateName: "data-deletion-warning",
                recipientEmail: email,
                idempotencyKey: `data-deletion-warning-${profile.id}-${profile.subscription_ended_at}`,
                templateData: {
                  userName: profile.user_name || "Usuário",
                  daysLeft: Math.max(0, Math.ceil(15 - (now.getTime() - new Date(profile.subscription_ended_at!).getTime()) / (1000 * 60 * 60 * 24))),
                },
              },
            });
            logStep("Sent data deletion warning email", { userId: profile.id, email });
          }

          // Mark as notified
          await supabaseClient.from("profiles").update({
            data_deletion_notified: true,
          }).eq("id", profile.id);
        } catch (err) {
          logStep("Error notifying user (non-blocking)", { userId: profile.id, error: err.message });
        }
      }
    }

    // Step 2: Delete data for users past 15 days
    const { data: usersToClean } = await supabaseClient
      .from("profiles")
      .select("id, user_name")
      .not("subscription_ended_at", "is", null)
      .lte("subscription_ended_at", fifteenDaysAgo);

    if (usersToClean && usersToClean.length > 0) {
      logStep("Users past 15-day retention, cleaning data", { count: usersToClean.length });

      for (const profile of usersToClean) {
        try {
          // Delete all user data (entries, fixed_bills, budget_goals)
          await Promise.all([
            supabaseClient.from("entries").delete().eq("user_id", profile.id),
            supabaseClient.from("fixed_bills").delete().eq("user_id", profile.id),
            supabaseClient.from("budget_goals").delete().eq("user_id", profile.id),
          ]);

          // Reset profile but keep account
          await supabaseClient.from("profiles").update({
            custom_categories: [],
            custom_income_categories: [],
            subscription_ended_at: null,
            data_deletion_notified: false,
          }).eq("id", profile.id);

          logStep("Cleaned data for user", { userId: profile.id });

          // Send final notification
          try {
            const { data: authUser } = await supabaseClient.auth.admin.getUserById(profile.id);
            if (authUser?.user?.email) {
              await supabaseClient.functions.invoke("send-transactional-email", {
                body: {
                  templateName: "data-deleted",
                  recipientEmail: authUser.user.email,
                  idempotencyKey: `data-deleted-${profile.id}-${Date.now()}`,
                  templateData: {
                    userName: profile.user_name || "Usuário",
                  },
                },
              });
            }
          } catch (emailErr) {
            logStep("Error sending deletion confirmation email (non-blocking)", { error: emailErr.message });
          }
        } catch (err) {
          logStep("Error cleaning user data", { userId: profile.id, error: err.message });
        }
      }
    }

    const summary = {
      notified: usersToNotify?.length || 0,
      cleaned: usersToClean?.length || 0,
    };
    logStep("Cleanup complete", summary);

    return new Response(JSON.stringify({ success: true, ...summary }), {
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
