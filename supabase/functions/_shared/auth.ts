import { createClient } from "npm:@supabase/supabase-js@2.57.2";

/** Decode JWT payload without verifying. Only safe when verify_jwt=true (gateway verified signature). */
export function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const p = parts[1].replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    return JSON.parse(atob(p));
  } catch {
    return null;
  }
}

function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

/** True if the caller presents the service role key (verified by gateway or exact match). */
export function isServiceRole(req: Request): boolean {
  const token = bearer(req);
  if (!token) return false;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (key && token === key) return true;
  return parseJwtClaims(token)?.role === "service_role";
}

/** Verifies a signed-in user session; returns the user or null. */
export async function getAuthUser(req: Request) {
  const token = bearer(req);
  if (!token) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function maskEmail(email?: string | null): string {
  if (!email) return "";
  const [u, d] = email.split("@");
  return `${(u || "").slice(0, 1)}***@${d || ""}`;
}

const ALLOWED_ORIGINS = [
  "https://appcontaclaralite.lovable.app",
  "https://applite.dynamismartapps.com",
  "https://id-preview--00174129-49b0-4f98-a19e-c3f69ed4ef17.lovable.app",
  "http://localhost:8080",
];

/** Returns the request origin only if it is on the allowlist, else the production URL. */
export function safeOrigin(req: Request): string {
  const o = req.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.includes(o)) return o;
  if (/^https:\/\/[a-z0-9-]+--00174129-49b0-4f98-a19e-c3f69ed4ef17\.lovable\.app$/.test(o)) return o;
  return ALLOWED_ORIGINS[0];
}
