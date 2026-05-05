// Manages 2FA backup codes: generate (auth required) and recover (public, validates code → unenrolls all TOTP factors)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateCode(): string {
  // 10 chars, base32-like, grouped XXXXX-XXXXX
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < 10; i++) s += alphabet[bytes[i] % alphabet.length];
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || (await req.clone().json().catch(() => ({})))?.action;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (action === "generate") {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u, error: ue } = await userClient.auth.getUser();
      if (ue || !u?.user) return json({ error: "Unauthorized" }, 401);
      const userId = u.user.id;

      // Delete previous codes
      await admin.from("mfa_backup_codes").delete().eq("user_id", userId);

      const codes = Array.from({ length: 10 }, generateCode);
      const rows = await Promise.all(codes.map(async (c) => ({
        user_id: userId,
        code_hash: await sha256(c),
      })));
      const { error: ie } = await admin.from("mfa_backup_codes").insert(rows);
      if (ie) return json({ error: ie.message }, 500);

      return json({ codes });
    }

    if (action === "recover") {
      const body = await req.json().catch(() => ({}));
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const code = String(body.code || "").trim().toUpperCase();
      if (!email || !password || !code) return json({ error: "Dados incompletos" }, 400);

      // Validate password by signing in
      const tmpClient = createClient(SUPABASE_URL, ANON_KEY);
      const { data: signIn, error: siErr } = await tmpClient.auth.signInWithPassword({ email, password });
      if (siErr || !signIn?.user) return json({ error: "E-mail ou senha incorretos" }, 401);
      const userId = signIn.user.id;
      // Sign out the temporary session immediately
      await tmpClient.auth.signOut();

      const codeHash = await sha256(code);
      const { data: row, error: re } = await admin
        .from("mfa_backup_codes")
        .select("id, used_at")
        .eq("user_id", userId)
        .eq("code_hash", codeHash)
        .maybeSingle();
      if (re) return json({ error: re.message }, 500);
      if (!row) return json({ error: "Código de recuperação inválido" }, 401);
      if (row.used_at) return json({ error: "Este código já foi utilizado" }, 401);

      // Mark code used
      await admin.from("mfa_backup_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);

      // Unenroll ALL MFA factors for this user via admin API
      // @ts-ignore - admin namespace
      const { data: factorList } = await (admin.auth.admin as any).mfa.listFactors({ userId });
      const factors = factorList?.factors || [];
      for (const f of factors) {
        try {
          // @ts-ignore
          await (admin.auth.admin as any).mfa.deleteFactor({ userId, id: f.id });
        } catch (_) { /* ignore */ }
      }

      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return json({ error: e.message || "Internal error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
