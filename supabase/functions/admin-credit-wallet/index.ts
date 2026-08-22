import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Unauthorized", supabase: null };
  }

  const jwt = authHeader.slice("Bearer ".length);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return { user: null, error: "Server not configured", supabase: null };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user) {
    return { user: null, error: error?.message || "Unauthorized", supabase: null };
  }

  return { user: data.user, error: null, supabase };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...corsHeaders } });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const { user, error: userError, supabase } = await requireUser(req);
  if (!user || !supabase) {
    return jsonResponse({ error: userError || "Unauthorized" }, 401);
  }

  // Edge Functions use the service role (bypasses RLS), so admin checks
  // must live here — never trust a client-supplied "I am admin" flag.
  const { data: callerProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) return jsonResponse({ error: profileErr.message }, 400);
  if (!callerProfile || callerProfile.role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const body = await req.json().catch(() => null);
  const targetUserId = body?.target_user_id;
  const amount = Number(body?.amount);
  const note = typeof body?.note === "string" ? body.note.trim() : null;

  if (!targetUserId || typeof targetUserId !== "string") {
    return jsonResponse({ error: "Missing or invalid target_user_id" }, 400);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonResponse({ error: "Amount must be a positive number" }, 400);
  }

  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetErr) return jsonResponse({ error: targetErr.message }, 400);
  if (!target) return jsonResponse({ error: "Target user not found" }, 404);

  const { data: txId, error: rpcErr } = await supabase.rpc("adjust_wallet_balance", {
    p_user_id: targetUserId,
    p_amount: amount,
    p_type: "admin_credit",
    p_reference_order_id: null,
    p_note: note || null,
    p_created_by: user.id,
  });

  if (rpcErr) return jsonResponse({ error: rpcErr.message }, 400);

  const { data: updatedProfile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", targetUserId)
    .maybeSingle();

  return jsonResponse({
    ok: true,
    transaction_id: txId,
    wallet_balance: updatedProfile?.wallet_balance ?? null,
  });
});
