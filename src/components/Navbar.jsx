import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import AvatarMenu from './AvatarMenu.jsx'
import BrandMark from './BrandMark.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/categories', label: 'Categories' },
  { to: '/designs', label: 'All Designs', shortLabel: 'Designs' },
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
      <nav className="max-w-6xl mx-auto flex items-center justify-between gap-2 lg:gap-3 px-3 sm:px-5 h-[4.5rem] min-w-0">
        <div className="shrink-0 min-w-0 max-w-[58%] sm:max-w-none">
          <BrandMark onClick={() => setOpen(false)} />
        </div>

        <div className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-1">
          <div className="flex items-center gap-3 xl:gap-5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `text-sm font-semibold tracking-wide whitespace-nowrap transition-colors duration-150 ${
                    isActive ? 'text-maroon' : 'text-ink-soft hover:text-maroon'
                  }`
                }
              >
                {link.shortLabel ? (
                  <>
                    <span className="lg:inline xl:hidden">{link.shortLabel}</span>
                    <span className="hidden xl:inline">{link.label}</span>
                  </>
                ) : (
                  link.label
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5">
          {!loading && session && <AvatarMenu />}
          {!loading && !session && (
            <button
              onClick={() => navigate('/login')}
              className="hidden lg:inline-flex btn-primary !py-2 !px-4 !text-xs"
            >
              Login
            </button>
          )}

          <button
            className="lg:hidden text-ink w-9 h-9 inline-flex items-center justify-center"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
