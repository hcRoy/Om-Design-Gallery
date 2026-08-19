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
  const designId = body?.design_id;
  if (!designId || typeof designId !== "string") {
    return jsonResponse({ error: "Missing or invalid design_id" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: design, error: designErr } = await supabase
    .from("designs")
    .select("id, price, design_file_url, is_active")
    .eq("id", designId)
    .eq("is_active", true)
    .maybeSingle();

  if (designErr) return jsonResponse({ error: designErr.message }, 400);
  if (!design) return jsonResponse({ error: "Design not found" }, 404);

  if (!design.design_file_url) {
    return jsonResponse({ error: "Design file is missing" }, 400);
  }

  const priceNumber = typeof design.price === "string" ? Number(design.price) : design.price;
  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return jsonResponse({ error: "Invalid design price" }, 400);
  }

  const amountPaise = Math.round(priceNumber * 100);

  // Razorpay restricts `receipt` length to <= 56 chars.
  // Use truncated IDs + timestamp to keep it short and stable.
  const receipt = `r_${user.id.slice(0, 8)}_${design.id.slice(0, 8)}_${Date.now()}`;
  const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

  const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      payment_capture: 1,
    }),
  });

  const rpJson = await rpRes.json().catch(() => null);
  if (!rpRes.ok) {
    return jsonResponse(
      { error: "Failed to create Razorpay order", details: rpJson || null },
      502,
    );
  }

  const razorpayOrderId = rpJson?.id;
  if (!razorpayOrderId || typeof razorpayOrderId !== "string") {
    return jsonResponse({ error: "Invalid Razorpay order response" }, 502);
  }

  const { error: insertErr } = await supabase.from("orders").insert({
    user_id: user.id,
    design_id: design.id,
    amount: priceNumber,
    status: "pending",
    razorpay_order_id: razorpayOrderId,
  });

  if (insertErr) {
    return jsonResponse({ error: insertErr.message }, 500);
  }

  return jsonResponse({
    razorpay_order_id: razorpayOrderId,
    amount: amountPaise,
    currency: "INR",
    key_id: razorpayKeyId,
  });
});

