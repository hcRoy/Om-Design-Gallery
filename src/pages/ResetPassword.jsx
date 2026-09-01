import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'
import { updatePassword } from '../lib/auth.js'
import { validatePassword, passwordsMatch } from '../lib/password.js'
import { useAuth } from '../context/AuthContext.jsx'
import Seo from '../components/Seo.jsx'
import BrandMark from '../components/BrandMark.jsx'

const inputClass =
  'w-full border border-ink/15 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-maroon'

function parseAuthHashError() {
  const hash = window.location.hash?.replace(/^#/, '') ?? ''
  if (!hash) return null

  const params = new URLSearchParams(hash)
  const errorCode = params.get('error_code')
  const errorDescription = params.get('error_description')

  if (errorCode || params.get('error')) {
    return errorDescription?.replace(/\+/g, ' ') ?? 'This reset link is invalid or has expired.'
  }

  return null
}

export default function ResetPassword() {
  const { configured } = useAuth()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState(parseAuthHashError())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const hashError = parseAuthHashError()
    if (hashError) {
      setLinkError(hashError)
      return
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
        setLinkError(null)
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
        setLinkError(null)
      }
    })

    const timeout = window.setTimeout(() => {
      setReady((current) => {
        if (!current && !parseAuthHashError()) {
          setLinkError('This reset link is invalid or has expired.')
        }
        return current
      })
    }, 5000)

    return () => {
      window.clearTimeout(timeout)
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      setError(`Password must have ${passwordCheck.errors.join(', ')}.`)
      return
    }
    if (!passwordsMatch(password, confirmPassword)) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    const { error: err } = await updatePassword(password)
    setBusy(false)

    if (err) {
      setError(err)
      return
    }

    setSuccess(true)
    window.history.replaceState({}, document.title, window.location.pathname)

    if (supabase) {
      await supabase.auth.signOut({ scope: 'global' })
    }
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-sand">
      <Seo title="Reset Password" description="Set a new password for your account." noIndex />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-sm shadow-card p-8 md:p-10 w-full max-w-md"
      >
        <div className="mb-8">
          <BrandMark to="/" />
        </div>

        {!configured && (
          <div className="mb-6 text-sm bg-gold-light/30 border border-gold-dark/30 text-ink rounded-sm px-4 py-3">
            Supabase isn&rsquo;t connected yet.
          </div>
        )}

        {success ? (
          <>
            <p className="eyebrow">Done</p>
            <h1 className="text-3xl mt-2 mb-3">Password updated</h1>
            <p className="text-sm text-ink-soft mb-6">
              Your new password is saved. The reset link has expired — sign in with your new
              password.
            </p>
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => navigate('/login', { replace: true, state: { resetSuccess: true } })}
            >
              Go to sign in
            </button>
          </>
        ) : linkError ? (
          <>
            <p className="eyebrow">Link expired</p>
            <h1 className="text-3xl mt-2 mb-3">Reset link invalid</h1>
            <p className="text-sm text-maroon mb-6">{linkError}</p>
            <Link to="/login" className="btn-primary w-full text-center block">
              Request a new link
            </Link>
          </>
        ) : !ready ? (
          <>
            <p className="eyebrow">Verifying</p>
            <h1 className="text-3xl mt-2 mb-3">Checking link…</h1>
            <p className="text-sm text-ink-soft">
              Hang on while we verify your secure reset session.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">Secure session</p>
            <h1 className="text-3xl mt-2 mb-1">Set new password</h1>
            <p className="text-sm text-ink-soft mb-8">
              Choose a strong password you haven&rsquo;t used elsewhere.
            </p>

            {error && (
              <div className="mb-6 text-sm bg-maroon/10 border border-maroon/30 text-maroon rounded-sm px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold mb-1.5">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-ink-soft/80 mt-1.5">
                  At least 8 characters with a letter and a number.
                </p>
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-semibold mb-1.5">
                  Confirm new password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </section>
  )
}
