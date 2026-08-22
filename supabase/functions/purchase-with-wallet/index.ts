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

  const body = await req.json().catch(() => null);
  const designId = body?.design_id;
  const offerCode = body?.offer_code ?? null;

  if (!designId || typeof designId !== "string") {
    return jsonResponse({ error: "Missing or invalid design_id" }, 400);
  }

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

  // Re-validate offer at charge time — never trust an earlier client preview.
  const offerResult = await resolveOffer(supabase, priceNumber, offerCode);
  if (offerCode && !offerResult.applicable) {
    return jsonResponse({ error: offerResult.reason || "Offer is not applicable" }, 400);
  }

  const finalAmount = offerResult.applicable ? offerResult.final_amount : priceNumber;
  const offerId = offerResult.applicable ? offerResult.offer_id : null;

  if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
    return jsonResponse({ error: "Invalid payable amount after offer" }, 400);
  }

  // Full-wallet-only: debit must cover the entire final amount.
  const { data: txId, error: debitErr } = await supabase.rpc("adjust_wallet_balance", {
    p_user_id: user.id,
    p_amount: -finalAmount,
    p_type: "purchase_debit",
    p_reference_order_id: null,
    p_note: `Wallet purchase for design ${design.id}`,
    p_created_by: null,
  });

  if (debitErr) {
    const msg = debitErr.message || "Wallet debit failed";
    const status = msg.toLowerCase().includes("insufficient") ? 400 : 500;
    return jsonResponse({ error: msg }, status);
  }

  const { data: order, error: insertErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      design_id: design.id,
      amount: finalAmount,
      status: "paid",
      payment_method: "wallet",
      offer_id: offerId,
      offer_usage_counted: false,
    })
    .select("id")
    .single();

  if (insertErr || !order) {
    // Best-effort refund if order insert fails after debit.
    await supabase.rpc("adjust_wallet_balance", {
      p_user_id: user.id,
      p_amount: finalAmount,
      p_type: "refund",
      p_reference_order_id: null,
      p_note: "Auto-refund: order insert failed after wallet debit",
      p_created_by: null,
    });
    return jsonResponse({ error: insertErr?.message || "Failed to create order" }, 500);
  }

  if (txId) {
    await supabase
      .from("wallet_transactions")
      .update({ reference_order_id: order.id })
      .eq("id", txId);
  }

  if (offerId) {
    const { error: usageErr } = await supabase.rpc("consume_order_offer_usage", {
      p_order_id: order.id,
    });
    if (usageErr) {
      return jsonResponse({ error: usageErr.message }, 500);
    }
  }

  const { data: signed, error: signedErr } = await supabase.storage
    .from("design-files")
    .createSignedUrl(design.design_file_url, 60 * 10);

  if (signedErr) return jsonResponse({ error: signedErr.message }, 500);

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .maybeSingle();

  return jsonResponse({
    order_id: order.id,
    signed_url: signed.signedUrl,
    final_amount: finalAmount,
    original_amount: priceNumber,
    discount_amount: offerResult.applicable ? offerResult.discount_amount : 0,
    wallet_balance: profile?.wallet_balance ?? null,
    payment_method: "wallet",
  });
});
