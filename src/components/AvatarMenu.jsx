import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'

export default function AvatarMenu() {
  const { profile, user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const initial =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ??
    user?.phone?.slice(-2) ??
    '•'

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
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
            className="absolute right-0 mt-2 w-48 bg-white rounded-sm shadow-card border border-ink/10 py-2 z-50"
          >
            <p className="px-4 py-2 text-xs text-ink-soft/70 border-b border-ink/10 truncate">
              {profile?.full_name || user?.phone}
            </p>
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
