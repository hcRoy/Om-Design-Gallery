import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchDesignBySlug } from '../lib/catalog.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import WishlistButton from '../components/WishlistButton.jsx'
import Seo from '../components/Seo.jsx'
import { callEdgeFunction, loadRazorpayCheckoutScript } from '../lib/razorpay.js'

const specRows = (design) => [
  ['File format', design.file_format],
  ['Stitch count', design.stitch_count?.toLocaleString()],
  ['Size', design.size_mm ? `${design.size_mm} mm` : null],
]

export default function DesignDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { configured, session, profile, user } = useAuth()
  const { showToast } = useToast()

  const [design, setDesign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  const [buying, setBuying] = useState(false)
  const [signedUrl, setSignedUrl] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    fetchDesignBySlug(slug).then(({ design: d }) => {
      if (!active) return
      if (!d) {
        setNotFound(true)
      } else {
        setDesign(d)
        setActiveImage(0)
      }
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [slug])

  const handleBuyNow = async () => {
    if (!configured) {
      showToast('Checkout is available once Supabase is connected.', { type: 'info' })
      return
    }
    if (!session?.access_token) {
      showToast('Please sign in to purchase designs.', { type: 'info' })
      navigate('/login', { state: { from: `/designs/${slug}` } })
      return
    }
    if (!design?.id) return

    setSignedUrl(null)
    setBuying(true)

    try {
      await loadRazorpayCheckoutScript()

      const createPayload = { design_id: design.id }
      const createRes = await callEdgeFunction(
        'create-razorpay-order',
        createPayload,
        session.access_token,
      )

      const { razorpay_order_id, amount, currency, key_id } = createRes

      const rzp = new window.Razorpay({
        key: key_id,
        order_id: razorpay_order_id,
        amount,
        currency,
        name: 'Om Design & Classes',
        description: design.name,
        prefill: {
          name: profile?.full_name || user?.email || 'Customer',
          email: profile?.email || user?.email || '',
          contact: profile?.phone || '',
        },
        handler: async function (response) {
          try {
            const verifyRes = await callEdgeFunction(
              'verify-razorpay-payment',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              session.access_token,
            )

            setSignedUrl(verifyRes.signed_url)
            showToast('Payment successful. Download is ready.', { type: 'success' })
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Payment verification failed'
            showToast(msg, { type: 'error' })
          } finally {
            setBuying(false)
          }
        },
        modal: {
          ondismiss: function () {
            setBuying(false)
            showToast('Payment cancelled.', { type: 'info' })
          },
        },
      })

      rzp.open()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Checkout failed'
      showToast(msg, { type: 'error' })
      setBuying(false)
    }
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-24 text-center text-ink-soft">Loading…</div>
  }

  if (notFound) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl mb-3">Design not found</h1>
        <p className="text-ink-soft mb-6">It may have been removed or the link is out of date.</p>
        <Link to="/designs" className="btn-primary">
          Browse all designs
        </Link>
      </div>
    )
  }

  const gallery = design.gallery_urls?.length ? design.gallery_urls : [design.thumbnail_url]

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      <Seo
        title={design.name}
        description={design.description ?? `${design.name} — a machine-embroidery design from Om Design & Classes.`}
      />
      <nav className="text-xs text-ink-soft mb-8 flex gap-2" aria-label="Breadcrumb">
        <Link to="/designs" className="hover:text-maroon">Designs</Link>
        <span>/</span>
        <span className="text-ink">{design.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-sand rounded-sm overflow-hidden flex items-center justify-center">
            {gallery[activeImage] ? (
              <img
                src={gallery[activeImage]}
                alt={`${design.name} — view ${activeImage + 1}`}
                loading="eager"
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-xs text-ink-soft/60">[ product image slot {activeImage + 1} ]</p>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-4">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`w-16 h-16 rounded-sm bg-sand border-2 flex items-center justify-center ${
                    activeImage === i ? 'border-maroon' : 'border-transparent'
                  }`}
                >
                  <span className="text-[10px] text-ink-soft/60">{i + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {design.categories?.name && <p className="eyebrow">{design.categories.name}</p>}
          <h1 className="text-3xl md:text-4xl mt-2">{design.name}</h1>
          <p className="text-2xl text-maroon font-semibold mt-4">₹{design.price}</p>
          <p className="text-ink-soft leading-relaxed mt-5">{design.description}</p>

          <dl className="mt-8 border-t border-ink/10 divide-y divide-ink/10">
            {specRows(design)
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between py-3 text-sm">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
          </dl>

          {design.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {design.tags.map((tag) => (
                <span key={tag} className="text-xs bg-sand text-ink-soft px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-9 items-start">
            <button
              onClick={handleBuyNow}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={buying}
            >
              {buying ? 'Processing…' : 'Buy Now'}
            </button>
            <WishlistButton designId={design.id} redirectPath={`/designs/${slug}`} />
          </div>

          {signedUrl && (
            <div className="mt-5">
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex !rounded-xl !py-2.5 !px-5"
              >
                Download your file
              </a>
            </div>
          )}

          {!configured && (
            <p className="text-xs text-ink-soft/70 mt-4">
              Wishlist and checkout will start working once Supabase is connected.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
