import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveOffer } from "../_shared/offers.ts";
import { corsPreflightResponse, jsonResponse } from "../_shared/cors.ts";

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
    return corsPreflightResponse();
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
  const offerCode = body?.offer_code ?? null;
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

  // Re-validate offer at charge time — never trust an earlier client validate-offer call.
  const offerResult = await resolveOffer(supabase, priceNumber, offerCode);
  if (offerCode && !offerResult.applicable) {
    return jsonResponse({ error: offerResult.reason || "Offer is not applicable" }, 400);
  }

  const finalAmount = offerResult.applicable ? offerResult.final_amount : priceNumber;
  const offerId = offerResult.applicable ? offerResult.offer_id : null;

  if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
    return jsonResponse({ error: "Invalid payable amount after offer" }, 400);
  }

  const amountPaise = Math.round(finalAmount * 100);

  // Razorpay restricts `receipt` length to <= 56 chars.
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
    amount: finalAmount,
    status: "pending",
    razorpay_order_id: razorpayOrderId,
    offer_id: offerId,
    payment_method: "razorpay",
  });

  if (insertErr) {
    return jsonResponse({ error: insertErr.message }, 500);
  }

  return jsonResponse({
    razorpay_order_id: razorpayOrderId,
    amount: amountPaise,
    currency: "INR",
    key_id: razorpayKeyId,
    original_amount: priceNumber,
    discount_amount: offerResult.applicable ? offerResult.discount_amount : 0,
    final_amount: finalAmount,
    offer: offerResult.applicable
      ? {
        offer_id: offerResult.offer_id,
        code: offerResult.code,
        discount_percentage: offerResult.discount_percentage,
      }
      : null,
  });
});
