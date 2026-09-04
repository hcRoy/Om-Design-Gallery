import { supabase } from './supabaseClient.js'
import { validatePassword } from './password.js'
import { callEdgeFunction } from './razorpay.js'

const NOT_CONFIGURED_ERROR =
  'Supabase isn\u2019t connected yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable login.'

const GENERIC_LOGIN_ERROR = 'Invalid email/mobile or password.'
const GENERIC_SIGNUP_ERROR =
  'Could not create the account. If you already have an account, try signing in or resetting your password.'

export function normalizePhone(input) {
  const raw = String(input ?? '').trim()
  const digits = raw.replace(/\D/g, '')

  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (raw.startsWith('+')) return `+${digits}`

  return digits ? `+${digits}` : ''
}

export function isValidEmail(email) {
  const value = String(email ?? '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isValidIndianMobile(input) {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits)
  if (digits.length === 12 && digits.startsWith('91')) return /^91[6-9]\d{9}$/.test(digits)
  return false
}

function authRedirectUrl(path) {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}${path}`
}

export async function signUp({ fullName, phone, email, password }) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = normalizePhone(phone)
  const passwordCheck = validatePassword(password)

  if (!fullName?.trim()) {
    return { error: 'Name is required.' }
  }
  if (!isValidEmail(normalizedEmail)) {
    return { error: 'Enter a valid email address.' }
  }
  if (!isValidIndianMobile(phone)) {
    return { error: 'Enter a valid 10-digit mobile number.' }
  }
  if (!passwordCheck.valid) {
    return { error: `Password must have ${passwordCheck.errors.join(', ')}.` }
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        phone: normalizedPhone,
      },
      emailRedirectTo: authRedirectUrl('/login'),
    },
  })

  if (error) {
    // Avoid confirming whether the email is already registered.
    return { session: null, user: null, needsConfirmation: false, error: GENERIC_SIGNUP_ERROR }
  }

  const needsConfirmation = Boolean(data.user && !data.session)

  return {
    session: data.session ?? null,
    user: data.user ?? null,
    needsConfirmation,
    error: null,
  }
}

export async function signIn({ identifier, password }) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }

  const trimmedId = String(identifier ?? '').trim()
  if (!trimmedId || !password) {
    return { error: GENERIC_LOGIN_ERROR }
  }

  if (trimmedId.includes('@')) {
    if (!isValidEmail(trimmedId)) {
      return { error: GENERIC_LOGIN_ERROR }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedId.toLowerCase(),
      password,
    })

    if (error) {
      return { session: null, error: GENERIC_LOGIN_ERROR }
    }

    return { session: data.session ?? null, error: null }
  }

  if (!isValidIndianMobile(trimmedId)) {
    return { error: GENERIC_LOGIN_ERROR }
  }

  // Phone → email resolution stays server-side (no public lookup_email_by_phone RPC).
  try {
    const result = await callEdgeFunction('sign-in-with-phone', {
      phone: trimmedId,
      password,
    })

    if (!result?.session) {
      return { session: null, error: GENERIC_LOGIN_ERROR }
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    })

    if (sessionError) {
      return { session: null, error: GENERIC_LOGIN_ERROR }
    }

    return { session: result.session, error: null }
  } catch {
    return { session: null, error: GENERIC_LOGIN_ERROR }
  }
}

export async function requestPasswordReset(email) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }

  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  if (!isValidEmail(normalizedEmail)) {
    return { error: 'Enter a valid email address.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: authRedirectUrl('/reset-password'),
  })

  // Supabase returns success even when the email is unknown (prevents enumeration).
  if (error) {
    return { error: error.message ?? 'Could not send reset email. Try again later.' }
  }

  return { error: null }
}

export async function updatePassword(newPassword) {
  if (!supabase) return { error: NOT_CONFIGURED_ERROR }

  const passwordCheck = validatePassword(newPassword)
  if (!passwordCheck.valid) {
    return { error: `Password must have ${passwordCheck.errors.join(', ')}.` }
  }

  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  return { user: data?.user ?? null, error: error?.message ?? null }
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

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
  // Never allow the client to write wallet_balance or role.
  const { wallet_balance: _w, role: _r, ...safeUpdates } = updates || {}
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { profile: data ?? null, error: error?.message ?? null }
}
