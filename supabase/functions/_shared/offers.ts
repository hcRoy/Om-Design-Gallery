/**
 * Shared offer validation for Edge Functions.
 * Re-run at charge time — never trust an earlier client-side validate-offer result.
 */

export type OfferRow = {
  id: string
  code: string | null
  discount_percentage: number | string
  starts_at: string | null
  ends_at: string | null
  min_order_amount: number | string | null
  usage_limit: number | null
  times_used: number
  is_active: boolean
}

export type OfferValidation =
  | {
    applicable: true
    offer_id: string
    code: string | null
    discount_percentage: number
    original_amount: number
    discount_amount: number
    final_amount: number
  }
  | {
    applicable: false
    reason: string
  }

function num(value: number | string | null | undefined) {
  if (value == null) return null
  const n = typeof value === "string" ? Number(value) : value
  return Number.isFinite(n) ? n : null
}

function isWithinWindow(offer: OfferRow, now = new Date()) {
  if (offer.starts_at && new Date(offer.starts_at) > now) return false
  if (offer.ends_at && new Date(offer.ends_at) < now) return false
  return true
}

function usageAvailable(offer: OfferRow) {
  if (offer.usage_limit == null) return true
  return offer.times_used < offer.usage_limit
}

function meetsMinimum(offer: OfferRow, orderAmount: number) {
  const min = num(offer.min_order_amount)
  if (min == null) return true
  return orderAmount >= min
}

export function buildApplicableResult(offer: OfferRow, orderAmount: number): OfferValidation {
  const discountPercentage = num(offer.discount_percentage) ?? 0
  const discountAmount = Math.round((orderAmount * discountPercentage) / 100 * 100) / 100
  const finalAmount = Math.max(0, Math.round((orderAmount - discountAmount) * 100) / 100)

  return {
    applicable: true,
    offer_id: offer.id,
    code: offer.code,
    discount_percentage: discountPercentage,
    original_amount: orderAmount,
    discount_amount: discountAmount,
    final_amount: finalAmount,
  }
}

export function evaluateOffer(offer: OfferRow | null, orderAmount: number, notFoundReason = "Offer not found"): OfferValidation {
  if (!offer) {
    return { applicable: false, reason: notFoundReason }
  }
  if (!offer.is_active) {
    return { applicable: false, reason: "Offer is inactive" }
  }
  if (!isWithinWindow(offer)) {
    if (offer.starts_at && new Date(offer.starts_at) > new Date()) {
      return { applicable: false, reason: "Offer has not started yet" }
    }
    return { applicable: false, reason: "Offer has expired" }
  }
  if (!usageAvailable(offer)) {
    return { applicable: false, reason: "Offer usage limit reached" }
  }
  if (!meetsMinimum(offer, orderAmount)) {
    return { applicable: false, reason: "Order amount is below the offer minimum" }
  }
  return buildApplicableResult(offer, orderAmount)
}

export async function resolveOffer(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  orderAmount: number,
  code?: string | null,
): Promise<OfferValidation> {
  const trimmed = typeof code === "string" ? code.trim() : ""

  if (trimmed) {
    const { data: offer, error } = await supabase
      .from("offers")
      .select("*")
      .eq("code", trimmed)
      .maybeSingle()

    if (error) {
      return { applicable: false, reason: error.message }
    }
    return evaluateOffer(offer as OfferRow | null, orderAmount)
  }

  // Automatic offer: best currently-active no-code offer by discount %.
  const { data: offers, error } = await supabase
    .from("offers")
    .select("*")
    .is("code", null)
    .eq("is_active", true)

  if (error) {
    return { applicable: false, reason: error.message }
  }

  const now = new Date()
  const candidates = ((offers ?? []) as OfferRow[])
    .filter((o) => isWithinWindow(o, now) && usageAvailable(o) && meetsMinimum(o, orderAmount))
    .sort((a, b) => (num(b.discount_percentage) ?? 0) - (num(a.discount_percentage) ?? 0))

  if (!candidates.length) {
    return { applicable: false, reason: "No automatic offer available" }
  }

  return buildApplicableResult(candidates[0], orderAmount)
}
