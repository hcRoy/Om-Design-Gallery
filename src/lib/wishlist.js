import { supabase } from './supabaseClient.js'

const NOT_CONFIGURED_ERROR =
  'Supabase isn\u2019t connected yet — wishlist actions will start working once it is.'

export async function isWishlisted(userId, designId) {
  if (!supabase || !userId) return { wishlisted: false, error: null }
  const { data, error } = await supabase
    .from('wishlists')
    .select('design_id')
    .eq('user_id', userId)
    .eq('design_id', designId)
    .maybeSingle()
  return { wishlisted: !!data, error: error?.message ?? null }
}

export async function addToWishlist(userId, designId) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase.from('wishlists').insert({ user_id: userId, design_id: designId })
  return { error: error?.message ?? null }
}

export async function removeFromWishlist(userId, designId) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('design_id', designId)
  return { error: error?.message ?? null }
}

/** Used by the /wishlist page — returns full design rows, not just ids. */
export async function fetchWishlistDesigns(userId) {
  if (!supabase) return { designs: [], error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase
    .from('wishlists')
    .select('design_id, designs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return { designs: [], error: error.message }
  return { designs: data.map((row) => row.designs).filter(Boolean), error: null }
}
