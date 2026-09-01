import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile } from '../lib/auth.js'
import { supabase } from '../lib/supabaseClient.js'
import Section from '../components/Section.jsx'
import Seo from '../components/Seo.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { callEdgeFunction } from '../lib/razorpay.js'

/**
 * JUDGMENT CALL: phone and email are contact/profile fields here.
 * Login credentials live in Supabase Auth (email + password). Changing
 * email here does not change the sign-in email unless you also call
 * auth.updateUser — keep them in sync manually or extend this form later.
 */
export default function Account() {
  const { user, profile, refreshProfile, configured, session } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const [error, setError] = useState('')

  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [ordersError, setOrdersError] = useState('')
  const [downloadingOrderId, setDownloadingOrderId] = useState(null)
  const [downloadUrls, setDownloadUrls] = useState({})

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
      })
    }
  }, [profile])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('saving')
    setError('')
    const { error: err } = await updateProfile(user.id, {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
    })
    if (err) {
      setStatus('error')
      setError(err)
      return
    }
    await refreshProfile()
    setStatus('saved')
    showToast('Account details saved.', { type: 'success' })
  }

  useEffect(() => {
    if (!configured || !user?.id) {
      setOrdersLoading(false)
      return
    }

    let active = true
    setOrdersLoading(true)
    setOrdersError('')

    supabase
      .from('orders')
      .select('id,status,amount,created_at,design_id,payment_method')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(async ({ data, error: err }) => {
        if (!active) return
        if (err) {
          setOrdersError(err.message)
          setOrdersLoading(false)
          return
        }

        const rows = data ?? []
        const designIds = rows.map((o) => o.design_id).filter(Boolean)
        const { data: designs } = await supabase
          .from('designs')
          .select('id,name')
          .in('id', designIds)

        const designMap = new Map((designs ?? []).map((d) => [d.id, d.name]))
        setOrders(
          rows.map((o) => ({
            ...o,
            designName: designMap.get(o.design_id) || 'Design',
          })),
        )
        setOrdersLoading(false)
      })

    return () => {
      active = false
    }
  }, [configured, user?.id])

  const handleGetDownloadLink = async (orderId) => {
    if (!session?.access_token) {
      showToast('Please sign in again to download.', { type: 'error' })
      return
    }
    setDownloadingOrderId(orderId)
    try {
      const res = await callEdgeFunction(
        'request-order-download-url',
        { order_id: orderId },
        session.access_token,
      )
      setDownloadUrls((prev) => ({ ...prev, [orderId]: res.signed_url }))
      showToast('Download link is ready.', { type: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create download link'
      showToast(msg, { type: 'error' })
    } finally {
      setDownloadingOrderId(null)
    }
  }

  return (
    <Section eyebrow="Your account" title="My Account" align="left">
      <Seo title="My Account" noIndex />
      {!configured && (
        <div className="mb-6 text-sm bg-gold-light/30 border border-gold-dark/30 text-ink rounded-sm px-4 py-3 max-w-xl">
          Supabase isn&rsquo;t connected yet — this form is fully wired but
          has nothing to save to until the project URL and anon key are
          added.
        </div>
      )}

      {configured && (
        <div className="mb-8 max-w-xl rounded-xl border border-ink/10 bg-white px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-ink-soft">Wallet balance</p>
          <p className="mt-2 text-3xl font-display text-maroon tabular-nums">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 2,
            }).format(Number(profile?.wallet_balance ?? 0))}
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            Use your wallet at checkout when the balance fully covers the total.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <div>
          <label htmlFor="full_name" className="block text-sm font-semibold mb-1.5">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={form.full_name}
            onChange={handleChange}
            className="w-full border border-ink/15 rounded-sm px-4 py-2.5 text-sm
                       focus:outline-none focus:border-maroon bg-white"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-ink/15 rounded-sm px-4 py-2.5 text-sm
                       focus:outline-none focus:border-maroon bg-white"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-ink/15 rounded-sm px-4 py-2.5 text-sm
                       focus:outline-none focus:border-maroon bg-white"
          />
          <p className="text-xs text-ink-soft/70 mt-1.5">
            Changing this updates your contact record only — it won&rsquo;t
            change the number you sign in with.
          </p>
        </div>

        {status === 'error' && (
          <p className="text-sm text-maroon">{error}</p>
        )}

        <button type="submit" disabled={status === 'saving'} className="btn-primary disabled:opacity-60">
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-ink/10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-display leading-tight">Your orders</h2>
            <p className="text-sm text-ink-soft mt-1">
              Paid orders include short-lived signed download links.
            </p>
          </div>
        </div>

        {!configured ? (
          <p className="mt-6 text-sm bg-gold-light/30 border border-gold-dark/30 text-ink rounded-sm px-4 py-3 max-w-xl">
            Supabase isn&rsquo;t connected yet — order history will appear once your project is configured.
          </p>
        ) : ordersLoading ? (
          <div className="mt-6 bg-white rounded-xl border border-ink/10 overflow-hidden">
            <div className="px-4 py-3 text-xs text-ink-soft uppercase tracking-widest2 bg-sand/50 border-b border-ink/10">
              Loading orders…
            </div>
            <div className="divide-y divide-ink/5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-4 flex gap-3 items-center animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-sand" />
                  <div className="flex-1">
                    <div className="h-3 bg-ink/10 rounded w-1/2" />
                    <div className="h-3 bg-ink/5 rounded w-2/3 mt-2" />
                  </div>
                  <div className="w-24 h-8 bg-ink/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : ordersError ? (
          <p className="mt-6 text-sm text-maroon">{ordersError}</p>
        ) : orders.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">No orders yet. Purchase a design to see it here.</p>
        ) : (
          <div className="mt-6 bg-white rounded-xl border border-ink/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest2 text-ink-soft bg-sand/50 border-b border-ink/10">
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Paid via</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Design</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {orders.map((o) => {
                    const statusTone =
                      o.status === 'paid'
                        ? 'bg-teal/10 text-teal'
                        : o.status === 'failed'
                          ? 'bg-maroon/10 text-maroon'
                          : 'bg-ink/10 text-ink-soft'
                    return (
                      <tr key={o.id} className="align-top">
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-ink-soft">₹{o.amount}</td>
                        <td className="px-4 py-4 text-ink-soft capitalize">
                          {o.payment_method || '—'}
                        </td>
                        <td className="px-4 py-4 text-ink-soft">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-ink">{o.designName}</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {o.status !== 'paid' ? (
                            <span className="text-xs text-ink-soft">—</span>
                          ) : downloadUrls[o.id] ? (
                            <a
                              href={downloadUrls[o.id]}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-primary inline-flex !rounded-xl !py-2.5 !px-5 text-xs"
                            >
                              Download your file
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled={downloadingOrderId === o.id}
                              onClick={() => handleGetDownloadLink(o.id)}
                              className="btn-outline inline-flex !rounded-xl !py-2.5 !px-5 text-xs disabled:opacity-60"
                            >
                              {downloadingOrderId === o.id ? 'Generating…' : 'Get download link'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
