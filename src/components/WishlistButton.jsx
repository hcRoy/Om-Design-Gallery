import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { isWishlisted, addToWishlist, removeFromWishlist } from '../lib/wishlist.js'

/**
 * variant="icon" — compact heart button for catalog cards (overlaid on
 *   the thumbnail via Card's `topRight` slot)
 * variant="full" — labelled button for the product detail page
 *
 * Auth-gated: signed-out clicks redirect to /login rather than silently
 * failing or prompting inline, consistent with how Buy Now and other
 * account-required actions behave elsewhere.
 */
export default function WishlistButton({ designId, variant = 'full', redirectPath }) {
  const { user, session, configured } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [wishlisted, setWishlisted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (user) {
      isWishlisted(user.id, designId).then(({ wishlisted: w }) => {
        if (active) setWishlisted(w)
      })
    } else {
      setWishlisted(false)
    }
    return () => {
      active = false
    }
  }, [user, designId])

  const handleClick = async (e) => {
    // Cards wrap this in a <Link> — stop the click from also navigating.
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      navigate('/login', { state: { from: redirectPath } })
      return
    }
    setBusy(true)
    setError('')
    const { error: err } = wishlisted
      ? await removeFromWishlist(user.id, designId)
      : await addToWishlist(user.id, designId)
    setBusy(false)
    if (err) {
      setError(err)
      showToast(err, { type: 'error' })
      return
    }
    setWishlisted((v) => !v)
    if (variant === 'icon') {
      showToast(wishlisted ? 'Removed from wishlist.' : 'Added to wishlist.', { type: 'success', duration: 2500 })
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={busy}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wishlisted}
        title={!configured ? 'Wishlist needs Supabase connected' : undefined}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg leading-none
                    shadow-card transition-colors disabled:opacity-60 ${
                      wishlisted ? 'bg-maroon text-ivory' : 'bg-white/90 text-maroon hover:bg-white'
                    }`}
      >
        {wishlisted ? '♥' : '♡'}
      </button>
    )
  }

  return (
    <div>
      <button onClick={handleClick} disabled={busy} className="btn-outline disabled:opacity-60">
        {wishlisted ? '♥ Wishlisted' : '♡ Add to Wishlist'}
      </button>
      {error && <p className="text-xs text-maroon mt-2">{error}</p>}
    </div>
  )
}
