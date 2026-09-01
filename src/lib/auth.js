import { supabase } from './supabaseClient.js'
import { validatePassword } from './password.js'

const NOT_CONFIGURED_ERROR =
  'Supabase isn\u2019t connected yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable login.'

const GENERIC_LOGIN_ERROR = 'Invalid email/mobile or password.'

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

async function resolveLoginEmail(identifier) {
  const value = String(identifier ?? '').trim()
  if (!value || value.includes('@')) return null

  const { data: rpcEmail, error: rpcError } = await supabase.rpc('lookup_email_by_phone', {
    phone_input: value,
  })

  if (!rpcError && rpcEmail) {
    return String(rpcEmail).trim().toLowerCase()
  }

  return null
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
    const message = error.message?.toLowerCase().includes('already registered')
      ? 'An account with this email already exists. Try signing in.'
      : error.message
    return { session: null, user: null, needsConfirmation: false, error: message }
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

  let credentials

  if (trimmedId.includes('@')) {
    if (!isValidEmail(trimmedId)) {
      return { error: GENERIC_LOGIN_ERROR }
    }
    credentials = { email: trimmedId.toLowerCase() }
  } else {
    const phone = normalizePhone(trimmedId)
    if (!isValidIndianMobile(trimmedId)) {
      return { error: GENERIC_LOGIN_ERROR }
    }

    const email = await resolveLoginEmail(trimmedId)
    if (email) {
      credentials = { email }
    } else {
      credentials = { phone }
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    ...credentials,
    password,
  })

  if (error) {
    return { session: null, error: GENERIC_LOGIN_ERROR }
  }

  return { session: data.session ?? null, error: null }
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
  const { wallet_balance: _ignored, ...safeUpdates } = updates || {}
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { profile: data ?? null, error: error?.message ?? null }
}
