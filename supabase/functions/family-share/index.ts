import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "invite") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) throw new Error("E-mail inválido");

      // Try find existing
      const { data: existing } = await supabase
        .from("family_shares")
        .select("*")
        .eq("owner_id", user.id)
        .eq("invitee_email", email)
        .maybeSingle();

      let share = existing;
      if (!share) {
        const { data: inserted, error: insErr } = await supabase
          .from("family_shares")
          .insert({ owner_id: user.id, invitee_email: email, status: "pending" })
          .select()
          .single();
        if (insErr) throw insErr;
        share = inserted;
      } else if (share.status === "revoked") {
        const { data: updated } = await supabase
          .from("family_shares")
          .update({ status: "pending", invitee_id: null, accepted_at: null })
          .eq("id", share.id)
          .select()
          .single();
        share = updated;
      }

      // Get owner display name
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("user_name")
        .eq("id", user.id)
        .maybeSingle();
      const ownerName = ownerProfile?.user_name || user.email || "Alguém";

      // Send invite e-mail (best effort)
      const acceptUrl = `${Deno.env.get("SUPABASE_URL")?.replace("ioatqhiqhzumuxivjcon.supabase.co", "appcontaclaralite.lovable.app") || "https://appcontaclaralite.lovable.app"}/?familyInvite=${share!.invite_token}`;
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateName: "family-invite",
            recipientEmail: email,
            templateData: { ownerName, acceptUrl },
          }),
        });
      } catch (e) {
        console.error("invite email failed", e);
      }

      return new Response(JSON.stringify({ success: true, share }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-mine") {
      // Shares created by current user
      const { data } = await supabase
        .from("family_shares")
        .select("*")
        .eq("owner_id", user.id)
        .neq("status", "revoked")
        .order("created_at", { ascending: false });
      return new Response(JSON.stringify({ shares: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-shared-with-me") {
      const email = (user.email || "").toLowerCase();
      const { data } = await supabase
        .from("family_shares")
        .select("id, owner_id, status, accepted_at")
        .or(`invitee_id.eq.${user.id},invitee_email.eq.${email}`)
        .eq("status", "accepted");

      // Enrich with owner profile name
      const enriched = await Promise.all(
        (data || []).map(async (s: any) => {
          const { data: prof } = await supabase
            .from("profiles")
            .select("user_name")
            .eq("id", s.owner_id)
            .maybeSingle();
          return { ...s, owner_name: prof?.user_name || "Conta compartilhada" };
        })
      );
      return new Response(JSON.stringify({ shares: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "accept") {
      const inviteToken = String(body.token || "");
      if (!inviteToken) throw new Error("Token ausente");
      const email = (user.email || "").toLowerCase();

      const { data: share } = await supabase
        .from("family_shares")
        .select("*")
        .eq("invite_token", inviteToken)
        .maybeSingle();
      if (!share) throw new Error("Convite não encontrado");
      if (share.invitee_email.toLowerCase() !== email) {
        throw new Error("Este convite foi enviado para outro e-mail");
      }
      if (share.owner_id === user.id) {
        throw new Error("Você não pode aceitar seu próprio convite");
      }

      const { error: upErr } = await supabase
        .from("family_shares")
        .update({
          invitee_id: user.id,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", share.id);
      if (upErr) throw upErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      const id = String(body.id || "");
      if (!id) throw new Error("ID ausente");
      await supabase
        .from("family_shares")
        .update({ status: "revoked" })
        .eq("id", id)
        .eq("owner_id", user.id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação desconhecida");
  } catch (err: any) {
    console.error("family-share error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erro interno" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
