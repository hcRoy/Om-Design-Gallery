import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BrandMark from '../../components/BrandMark.jsx'
import Seo from '../../components/Seo.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { isAdmin, isStaff, roleLabel } from '../../lib/roles.js'
import {
  IconDashboard,
  IconPackage,
  IconFolder,
  IconLayers,
  IconShapes,
  IconImage,
  IconFile,
  IconUsers,
  IconOrders,
  IconTag,
  IconArrowLeft,
  IconMenu,
  IconX,
} from '../../components/admin/icons.jsx'

const allNavItems = [
  { to: '/admin', label: 'Dashboard', end: true, icon: IconDashboard, adminOnly: true },
  { to: '/admin/products', label: 'Products', icon: IconPackage, adminOnly: true },
  { to: '/admin/categories', label: 'Categories', icon: IconFolder, adminOnly: true },
  { to: '/admin/subcategories', label: 'Subcategories', icon: IconLayers, adminOnly: true },
  { to: '/admin/admissions', label: 'Admissions', icon: IconFile, adminOnly: false },
  { to: '/admin/design-types', label: 'Design Types', icon: IconShapes, adminOnly: true },
  { to: '/admin/offers', label: 'Offers', icon: IconTag, adminOnly: true },
  { to: '/admin/carousel', label: 'Carousel', icon: IconImage, adminOnly: true },
  { to: '/admin/users', label: 'Users', icon: IconUsers, adminOnly: true },
  { to: '/admin/orders', label: 'Orders', icon: IconOrders, adminOnly: true },
]

function NavList({ items, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
               transition-colors duration-150 ${
                 isActive
                   ? 'bg-maroon text-ivory shadow-sm'
                   : 'text-ink-soft hover:bg-sand hover:text-ink'
               }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function Brand({ stacked = false, subtitle = 'Admin' }) {
  return <BrandMark compact subtitle={subtitle} stacked={stacked} />
}

function SidebarFooter() {
  const { profile, user } = useAuth()
  const name = profile?.full_name || user?.phone || 'User'
  const initial = (name.trim()[0] || 'U').toUpperCase()
  const label = roleLabel(profile?.role)

  return (
    <div className="mt-auto pt-6 border-t border-ink/8">
      <div className="flex items-center gap-3 px-1 mb-4">
        <div className="w-8 h-8 rounded-full bg-maroon/10 text-maroon text-xs font-bold flex items-center justify-center">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{name}</p>
          <p className="text-[11px] text-ink-soft">{label}</p>
        </div>
      </div>
      <Link
        to="/"
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-ink-soft
                   hover:text-maroon hover:bg-sand transition-colors duration-150"
      >
        <IconArrowLeft className="w-3.5 h-3.5" />
        Back to site
      </Link>
    </div>
  )
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { profile } = useAuth()
  const admin = isAdmin(profile?.role)
  const staff = isStaff(profile?.role)

  const navItems = useMemo(
    () => allNavItems.filter((item) => admin || !item.adminOnly),
    [admin],
  )

  const brandSubtitle = staff && !admin ? 'Staff' : 'Admin'
  const seoTitle = staff && !admin ? 'Admissions' : 'Admin'

  const closeMobile = () => setMobileOpen(false)
  const toggleMobile = () => setMobileOpen((v) => !v)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-sand flex">
      <Seo title={seoTitle} noIndex />

      <aside className="hidden lg:flex w-[252px] shrink-0 sticky top-0 h-screen flex-col bg-ivory border-r border-ink/8 px-3 py-5">
        <div className="mb-6 min-w-0 max-w-full">
          <Brand stacked subtitle={brandSubtitle} />
        </div>
        <NavList items={navItems} />
        <SidebarFooter />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-50 bg-ivory/95 backdrop-blur border-b border-ink/8">
          <div className="flex items-center justify-between gap-2 px-3 min-h-14 py-1">
            <div className="min-w-0 flex-1 overflow-hidden">
              <Brand subtitle={brandSubtitle} />
            </div>
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={toggleMobile}
              className="relative z-10 w-9 h-9 shrink-0 rounded-xl text-ink hover:bg-sand inline-flex items-center justify-center transition-colors duration-150"
            >
              {mobileOpen ? <IconX className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="fixed inset-0 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm border-0 cursor-default"
                onClick={closeMobile}
                aria-label="Close menu"
              />
              <motion.aside
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -16, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 w-[min(280px,86vw)] h-full bg-ivory border-r border-ink/8 px-3 py-5 flex flex-col shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-label="Office menu"
              >
                <div className="flex items-start justify-between gap-2 mb-6">
                  <div className="min-w-0 flex-1 overflow-hidden pr-1">
                    <Brand stacked subtitle={brandSubtitle} />
                  </div>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={closeMobile}
                    className="relative z-10 w-9 h-9 shrink-0 rounded-lg text-ink-soft hover:bg-sand hover:text-ink
                               inline-flex items-center justify-center transition-colors duration-150"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </div>
                <NavList items={navItems} onNavigate={closeMobile} />
                <SidebarFooter />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
