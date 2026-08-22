import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveOffer } from "../_shared/offers.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...corsHeaders } });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server not configured" }, 500);
  }

  const body = await req.json().catch(() => null);
  const orderAmount = Number(body?.order_amount);
  const code = body?.code ?? null;

  if (!Number.isFinite(orderAmount) || orderAmount < 0) {
    return jsonResponse({ error: "Missing or invalid order_amount" }, 400);
  }

  // Service role is required because offers has no public SELECT policy.
  // This function never returns the full offers table — only one
  // validation result for the requested code (or best automatic offer).
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const result = await resolveOffer(supabase, orderAmount, code);

  return jsonResponse(result);
});
