import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchProfile, signIn, signUp, requestPasswordReset, isValidEmail, isValidIndianMobile } from '../lib/auth.js'
import { validatePassword, passwordsMatch } from '../lib/password.js'
import { useAuth } from '../context/AuthContext.jsx'
import Seo from '../components/Seo.jsx'
import BrandMark from '../components/BrandMark.jsx'
import { defaultPathForRole } from '../lib/roles.js'

const inputClass =
  'w-full border border-ink/15 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-maroon'

function FieldError({ message }) {
  if (!message) return null
  return <p className="text-xs text-maroon mt-1.5">{message}</p>
}

export default function Login() {
  const { configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const explicitFrom = location.state?.from
  const resetSuccess = location.state?.resetSuccess
  const routeNotice = location.state?.notice

  const [tab, setTab] = useState('login')
  const [view, setView] = useState('main')
  const [error, setError] = useState('')
  const [info, setInfo] = useState(
    resetSuccess
      ? 'Your password was updated. Sign in with your new password.'
      : routeNotice || '',
  )
  const [busy, setBusy] = useState(false)

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [forgotEmail, setForgotEmail] = useState('')

  const switchTab = (next) => {
    setTab(next)
    setView('main')
    setError('')
    setInfo('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)

    const { session, error: err } = await signIn({
      identifier: loginForm.identifier,
      password: loginForm.password,
    })

    setBusy(false)
    if (err) {
      setError(err)
      return
    }

    let dest = explicitFrom
    if (!dest && session?.user?.id) {
      const { profile } = await fetchProfile(session.user.id)
      dest = defaultPathForRole(profile?.role)
    }
    navigate(dest || '/account', { replace: true })
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    const passwordCheck = validatePassword(signupForm.password)
    if (!signupForm.fullName.trim()) {
      setError('Name is required.')
      return
    }
    if (!isValidIndianMobile(signupForm.phone)) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    if (!isValidEmail(signupForm.email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!passwordCheck.valid) {
      setError(`Password must have ${passwordCheck.errors.join(', ')}.`)
      return
    }
    if (!passwordsMatch(signupForm.password, signupForm.confirmPassword)) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    const { session, needsConfirmation, error: err } = await signUp({
      fullName: signupForm.fullName,
      phone: signupForm.phone,
      email: signupForm.email,
      password: signupForm.password,
    })
    setBusy(false)

    if (err) {
      setError(err)
      return
    }

    if (needsConfirmation) {
      setInfo(
        'Account created. Check your email to confirm your address, then sign in.',
      )
      setTab('login')
      setSignupForm({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
      return
    }

    if (session) {
      navigate(explicitFrom || '/account', { replace: true })
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!isValidEmail(forgotEmail)) {
      setError('Enter a valid email address.')
      return
    }

    setBusy(true)
    const { error: err } = await requestPasswordReset(forgotEmail)
    setBusy(false)

    if (err) {
      setError(err)
      return
    }

    setInfo(
      'If an account exists for that email, we sent a reset link. Check your inbox and spam folder.',
    )
    setForgotEmail('')
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-sand">
      <Seo
        title="Sign In"
        description="Sign in or create an account at Om Design & Classes."
        noIndex
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-sm shadow-card p-8 md:p-10 w-full max-w-md"
      >
        <div className="mb-8">
          <BrandMark to="/" />
        </div>

        {view === 'forgot' ? (
          <>
            <p className="eyebrow">Account recovery</p>
            <h1 className="text-3xl mt-2 mb-1">Reset password</h1>
            <p className="text-sm text-ink-soft mb-8">
              Enter your email and we&rsquo;ll send a secure link to set a new password.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">Welcome</p>
            <h1 className="text-3xl mt-2 mb-1">
              {tab === 'login' ? 'Sign in' : 'Create account'}
            </h1>
            <p className="text-sm text-ink-soft mb-8">
              {tab === 'login'
                ? 'Use your email or mobile number with your password.'
                : 'Register to save designs, wishlists, and orders.'}
            </p>

            <div className="flex rounded-sm border border-ink/10 bg-sand p-1 mb-6">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-colors ${
                  tab === 'login' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchTab('signup')}
                className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-colors ${
                  tab === 'signup' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
                }`}
              >
                Signup
              </button>
            </div>
          </>
        )}

        {!configured && (
          <div className="mb-6 text-sm bg-gold-light/30 border border-gold-dark/30 text-ink rounded-sm px-4 py-3">
            Supabase isn&rsquo;t connected yet, so sign-in is display-only for now.
          </div>
        )}

        {error && (
          <div className="mb-6 text-sm bg-maroon/10 border border-maroon/30 text-maroon rounded-sm px-4 py-3">
            {error}
          </div>
        )}

        {info && (
          <div
            role="status"
            className="mb-6 text-sm bg-sand border border-gold/40 text-ink rounded-sm px-4 py-3"
          >
            {info}
          </div>
        )}

        {view === 'forgot' ? (
          <form onSubmit={handleForgot} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-semibold mb-1.5">
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? 'Sending link…' : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('main')
                setError('')
                setInfo('')
              }}
              className="text-sm text-ink-soft underline underline-offset-4 w-full text-center"
            >
              Back to sign in
            </button>
          </form>
        ) : tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-semibold mb-1.5">
                Email or mobile number
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={loginForm.identifier}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, identifier: e.target.value }))
                }
                className={inputClass}
                placeholder="you@example.com or 9876543210"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, password: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('forgot')
                setError('')
                setInfo('')
              }}
              className="text-sm text-ink-soft underline underline-offset-4 w-full text-center"
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={signupForm.fullName}
                onChange={(e) =>
                  setSignupForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
                Mobile number
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                required
                value={signupForm.phone}
                onChange={(e) =>
                  setSignupForm((f) => ({
                    ...f,
                    phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                  }))
                }
                className={inputClass}
                placeholder="10-digit mobile number"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={signupForm.email}
                onChange={(e) =>
                  setSignupForm((f) => ({ ...f, email: e.target.value }))
                }
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-semibold mb-1.5">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={signupForm.password}
                onChange={(e) =>
                  setSignupForm((f) => ({ ...f, password: e.target.value }))
                }
                className={inputClass}
              />
              <p className="text-xs text-ink-soft/80 mt-1.5">
                At least 8 characters with a letter and a number.
              </p>
              <FieldError
                message={
                  signupForm.password && !validatePassword(signupForm.password).valid
                    ? `Needs ${validatePassword(signupForm.password).errors.join(', ')}.`
                    : ''
                }
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-1.5">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={signupForm.confirmPassword}
                onChange={(e) =>
                  setSignupForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                className={inputClass}
              />
              <FieldError
                message={
                  signupForm.confirmPassword &&
                  !passwordsMatch(signupForm.password, signupForm.confirmPassword)
                    ? 'Passwords do not match.'
                    : ''
                }
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </motion.div>
    </section>
  )
}
