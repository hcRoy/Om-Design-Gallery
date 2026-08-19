import { supabase } from './supabaseClient.js'

const NOT_CONFIGURED_ERROR =
  'Supabase isn\u2019t connected yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable login.'

/**
 * Sends a one-time code to the given phone number. Phone must be in
 * E.164 format (e.g. +919999999999) — the input in Login.jsx enforces
 * this before calling out.
 */
export async function sendOtp(phone) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { error } = await supabase.auth.signInWithOtp({ phone })
  return { error: error?.message ?? null }
}

/** Verifies the 6-digit code sent via sendOtp and establishes a session. */
export async function verifyOtp(phone, token) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  return { session: data?.session ?? null, error: error?.message ?? null }
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

/**
 * Fetches the caller's own `profiles` row (RLS restricts this to
 * auth.uid() = id already). The row itself is created server-side by
 * the `handle_new_user` trigger — see
 * supabase/migrations/002_profile_creation_trigger.sql — so this should
 * never need to insert, only select.
 */
export async function fetchProfile(userId) {
  if (!supabase || !userId) return { profile: null, error: null }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { profile: data ?? null, error: error?.message ?? null }
}

export async function updateProfile(userId, updates) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { profile: data ?? null, error: error?.message ?? null }
}
