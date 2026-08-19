import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hmacSha256Hex(secret: string, message: string) {
  const data = new TextEncoder().encode(message);
  const keyBytes = new TextEncoder().encode(secret);
  // Use WebCrypto in a way that works in Edge runtime.
  return crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]).then(async (key) => {
    const sig = await crypto.subtle.sign("HMAC", key, data);
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const razorpayWebhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!razorpayWebhookSecret || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server not configured" }, 500);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ||
    req.headers.get("X-Razorpay-Signature");

  if (!signature) {
    return jsonResponse({ error: "Missing Razorpay signature" }, 400);
  }

  const expected = await hmacSha256Hex(razorpayWebhookSecret, rawBody);
  if (expected.toLowerCase() !== signature.toLowerCase()) {
    return jsonResponse({ error: "Webhook signature verification failed" }, 401);
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload?.event;
  const paymentEntity = payload?.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;

  if (!eventType || typeof eventType !== "string") {
    return jsonResponse({ error: "Invalid webhook payload" }, 400);
  }
  if (!razorpayOrderId || typeof razorpayOrderId !== "string") {
    return jsonResponse({ error: "Missing order_id in webhook" }, 400);
  }

  const newStatus = eventType === "payment.captured"
    ? "paid"
    : eventType === "payment.failed"
      ? "failed"
      : null;

  if (!newStatus) {
    // Ignore unrelated events but acknowledge the webhook.
    return jsonResponse({ ok: true }, 200);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("razorpay_order_id", razorpayOrderId);

  if (updateErr) {
    return jsonResponse({ error: updateErr.message }, 500);
  }

  return jsonResponse({ ok: true }, 200);
});

