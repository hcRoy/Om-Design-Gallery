import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
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
    return { user: null, error: "Unauthorized" };
  }

  const jwt = authHeader.slice("Bearer ".length);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return { user: null, error: "Server not configured" };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.auth.getUser(jwt);

  if (error || !data?.user) {
    return { user: null, error: error?.message || "Unauthorized" };
  }

  return { user: data.user, error: null };
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...corsHeaders } });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const { user, error: userError } = await requireUser(req);
  if (!user) {
    return jsonResponse({ error: userError || "Unauthorized" }, 401);
  }

  const body = await req.json().catch(() => null);
  const razorpayOrderId = body?.razorpay_order_id;
  const razorpayPaymentId = body?.razorpay_payment_id;
  const razorpaySignature = body?.razorpay_signature;

  if (
    !razorpayOrderId || typeof razorpayOrderId !== "string" ||
    !razorpayPaymentId || typeof razorpayPaymentId !== "string" ||
    !razorpaySignature || typeof razorpaySignature !== "string"
  ) {
    return jsonResponse({ error: "Missing or invalid payment fields" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id,user_id,status,design_id,razorpay_order_id")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (orderErr) return jsonResponse({ error: orderErr.message }, 400);
  if (!order) return jsonResponse({ error: "Order not found" }, 404);

  if (order.user_id !== user.id) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const message = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = await hmacSha256Hex(razorpayKeySecret, message);

  if (expected.toLowerCase() !== razorpaySignature.toLowerCase()) {
    return jsonResponse({ error: "Signature verification failed" }, 400);
  }

  const { error: paidErr } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id);

  if (paidErr) return jsonResponse({ error: paidErr.message }, 500);

  const { data: design, error: designErr } = await supabase
    .from("designs")
    .select("design_file_url")
    .eq("id", order.design_id)
    .maybeSingle();

  if (designErr) return jsonResponse({ error: designErr.message }, 400);
  if (!design?.design_file_url) return jsonResponse({ error: "Design file missing" }, 400);

  const { data: signed, error: signedErr } = await supabase.storage
    .from("design-files")
    .createSignedUrl(design.design_file_url, 60 * 10);

  if (signedErr) return jsonResponse({ error: signedErr.message }, 500);

  return jsonResponse({ signed_url: signed.signedUrl });
});

