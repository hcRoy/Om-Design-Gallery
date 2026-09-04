import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/cors.ts";

const RATE_LIMIT_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ipHits = new Map<string, { count: number; windowStart: number }>();

const GENERIC_ERROR = "Invalid email/mobile or password.";

function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_MS) {
    ipHits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function normalizePhone(input: string): string | null {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!rateLimitOk(ip)) {
    return jsonResponse({ error: "Too many requests. Please try again later." }, 429);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: "Server not configured" }, 500);
  }

  const body = await req.json().catch(() => null);
  const phoneRaw = body?.phone;
  const password = body?.password;
  if (!phoneRaw || typeof phoneRaw !== "string" || !password || typeof password !== "string") {
    return jsonResponse({ error: GENERIC_ERROR }, 400);
  }

  const phone = normalizePhone(phoneRaw);
  if (!phone) return jsonResponse({ error: GENERIC_ERROR }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("email")
    .eq("phone", phone)
    .maybeSingle();

  if (profileErr) return jsonResponse({ error: GENERIC_ERROR }, 400);
  const email = profile?.email ? String(profile.email).trim().toLowerCase() : "";
  if (!email) return jsonResponse({ error: GENERIC_ERROR }, 401);

  // Sign in with the anon client so the returned session is a normal user session.
  const anon = createClient(supabaseUrl, anonKey);
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return jsonResponse({ error: GENERIC_ERROR }, 401);
  }

  return new Response(
    JSON.stringify({
      session: data.session,
      user: data.user,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
