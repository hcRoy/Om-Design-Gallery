import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { canAccessAdmissions, defaultPathForRole, isAdmin } from '../lib/roles.js'

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export default function AvatarMenu() {
  const { profile, user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const initial =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ??
    user?.phone?.slice(-2) ??
    '•'

  const walletBalance = Number(profile?.wallet_balance ?? 0)
  const panelPath = defaultPathForRole(profile?.role)
  const showOfficeLink = canAccessAdmissions(profile?.role)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
      <Link
        to="/account"
        className="hidden sm:inline-flex xl:inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5
                   text-xs font-semibold text-ink hover:border-maroon/25 transition-colors duration-150"
        title="Wallet balance"
      >
        <span className="text-ink-soft font-medium">Wallet</span>
        <span className="tabular-nums text-maroon">{formatMoney(walletBalance)}</span>
      </Link>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-10 h-10 rounded-full bg-maroon text-ivory font-semibold text-sm
                   flex items-center justify-center hover:bg-maroon-light transition-colors"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-sm shadow-card border border-ink/10 py-2 z-50 top-full"
          >
            <p className="px-4 py-2 text-xs text-ink-soft/70 border-b border-ink/10 truncate">
              {profile?.full_name || user?.phone}
            </p>
            <div className="px-4 py-2 border-b border-ink/10">
              <p className="text-[11px] uppercase tracking-wider text-ink-soft">Wallet balance</p>
              <p className="mt-1 text-sm font-semibold text-maroon tabular-nums">
                {formatMoney(walletBalance)}
              </p>
            </div>
            <Link
              to="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-sand"
            >
              My Account
            </Link>
            <Link
              to="/wishlist"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-sand"
            >
              Wishlist
            </Link>
            {showOfficeLink && (
              <Link
                to={panelPath}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-sand"
              >
                {isAdmin(profile?.role) ? 'Admin panel' : 'Admissions'}
              </Link>
            )}
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="block w-full text-left px-4 py-2 text-sm text-maroon hover:bg-sand"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
