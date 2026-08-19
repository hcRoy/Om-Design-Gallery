import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { sendOtp, verifyOtp } from '../lib/auth.js'
import { useAuth } from '../context/AuthContext.jsx'
import Seo from '../components/Seo.jsx'
import BrandMark from '../components/BrandMark.jsx'

/**
 * Phone-only, no email/password per the brief. E.164 formatting
 * (+<country code><number>) is enforced client-side since that's what
 * Supabase's SMS provider expects — shown as a fixed "+" prefix so
 * users don't have to remember the format themselves.
 */
export default function Login() {
  const { configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/account'

  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const fullPhone = phone.startsWith('+') ? phone : `+${phone}`

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: err } = await sendOtp(fullPhone)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    setStep('otp')
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: err } = await verifyOtp(fullPhone, code)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-sand">
      <Seo title="Sign In" description="Sign in to Om Design & Classes with your phone number." noIndex />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-sm shadow-card p-8 md:p-10 w-full max-w-md"
      >
        <div className="mb-8">
          <BrandMark to="/" />
        </div>
        <p className="eyebrow">Welcome back</p>
        <h1 className="text-3xl mt-2 mb-1">Sign in</h1>
        <p className="text-sm text-ink-soft mb-8">
          {step === 'phone'
            ? "We'll text you a one-time code — no password needed."
            : `Enter the code sent to ${fullPhone}.`}
        </p>

        {!configured && (
          <div className="mb-6 text-sm bg-gold-light/30 border border-gold-dark/30 text-ink rounded-sm px-4 py-3">
            Supabase isn&rsquo;t connected yet, so sign-in is display-only
            for now. This screen is fully wired and will work as soon as
            the project URL and anon key are added.
          </div>
        )}

        {error && (
          <div className="mb-6 text-sm bg-maroon/10 border border-maroon/30 text-maroon rounded-sm px-4 py-3">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
                Phone number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-ink/15 rounded-l-sm bg-sand text-sm text-ink-soft">
                  +
                </span>
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="919999999999"
                  value={phone.replace(/^\+/, '')}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full border border-ink/15 rounded-r-sm px-4 py-2.5 text-sm
                             focus:outline-none focus:border-maroon"
                />
              </div>
              <p className="text-xs text-ink-soft/70 mt-1.5">Country code, no spaces or dashes.</p>
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? 'Sending code…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold mb-1.5">
                6-digit code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full border border-ink/15 rounded-sm px-4 py-2.5 text-sm tracking-[0.3em]
                           focus:outline-none focus:border-maroon"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError('')
              }}
              className="text-sm text-ink-soft underline underline-offset-4 w-full text-center"
            >
              Use a different number
            </button>
          </form>
        )}
      </motion.div>
    </section>
  )
}
