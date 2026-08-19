/**
 * DEV-ONLY STUB.
 *
 * Simulates Supabase's phone + OTP auth flow (send code → verify code →
 * session) so the UI can be built, run, and demoed before real Supabase
 * credentials and an SMS provider are connected. There is no SMS here —
 * the "sent" code is printed to the browser console instead.
 *
 * AuthContext picks this module automatically whenever
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are unset (see
 * `usingMock` there). The moment those env vars are set, the real
 * `supabase.auth` calls take over and this file is simply never
 * imported into the active path — nothing in the components needs to
 * change. Safe to delete this file once real auth is confirmed working.
 *
 * Session persistence uses localStorage purely so a dev doesn't get
 * logged out on every hot reload. This is a throwaway dev session, not
 * a security boundary — don't reuse this pattern for real auth state.
 */

const STORAGE_KEY = 'odc_mock_session'
const pendingCodes = new Map() // phone -> code; cleared on page reload, that's fine for dev

function randomId() {
  return 'mock-' + Math.random().toString(36).slice(2, 10)
}

export function sendOtp(phone) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  pendingCodes.set(phone, code)
  // eslint-disable-next-line no-console
  console.info(`[mock auth] OTP for ${phone}: ${code}`)
  return Promise.resolve()
}

export function verifyOtp(phone, code) {
  const expected = pendingCodes.get(phone)
  if (!expected || expected !== code) {
    throw new Error('That code is incorrect or has expired.')
  }
  pendingCodes.delete(phone)

  const existing = getSession()
  const user = existing?.user?.phone === phone ? existing.user : { id: randomId(), phone }
  const profile =
    existing?.profile?.phone === phone
      ? existing.profile
      : { id: user.id, phone, full_name: '', email: '', role: 'customer' }

  const session = { user, profile }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function updateProfile(fields) {
  const session = getSession()
  if (!session) throw new Error('Not signed in.')
  const profile = { ...session.profile, ...fields }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, profile }))
  return profile
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEY)
}
