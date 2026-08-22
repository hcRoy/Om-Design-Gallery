import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import AvatarMenu from './AvatarMenu.jsx'
import BrandMark from './BrandMark.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/categories', label: 'Categories' },
  { to: '/designs', label: 'All Designs' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { session, loading, profile } = useAuth()
  const navigate = useNavigate()

  const walletLabel = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(profile?.wallet_balance ?? 0))

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-ink/10">
      <nav className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center px-6 h-20 gap-4">
        <BrandMark onClick={() => setOpen(false)} />

        <div className="hidden lg:flex items-center gap-8">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `text-sm font-semibold tracking-wide transition-colors duration-150 ${
                  isActive ? 'text-maroon' : 'text-ink-soft hover:text-maroon'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="justify-self-end flex items-center gap-3">
          {!loading && session && <AvatarMenu />}
          {!loading && !session && (
            <button
              onClick={() => navigate('/login')}
              className="hidden lg:inline-flex btn-primary !py-2.5 !px-5 !text-xs"
            >
              Login
            </button>
          )}

          <button
            className="lg:hidden text-ink w-10 h-10 inline-flex items-center justify-center"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {open ? (
                <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden border-b border-ink/10 bg-ivory"
          >
            <div className="flex flex-col gap-5 px-6 py-6">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `text-base font-semibold ${isActive ? 'text-maroon' : 'text-ink-soft'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {!loading && (session ? (
                <>
                  <p className="text-sm font-semibold text-maroon tabular-nums">
                    Wallet: {walletLabel}
                  </p>
                  <NavLink to="/account" onClick={() => setOpen(false)} className="text-base font-semibold text-ink-soft">
                    My Account
                  </NavLink>
                  <NavLink to="/wishlist" onClick={() => setOpen(false)} className="text-base font-semibold text-ink-soft">
                    Wishlist
                  </NavLink>
                </>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false)
                    navigate('/login')
                  }}
                  className="btn-primary w-full"
                >
                  Login
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
