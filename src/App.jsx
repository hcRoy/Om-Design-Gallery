import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'

// Route-level code splitting: Home loads eagerly (it's the most likely
// landing page and first paint matters most there), everything else is
// lazy so a visitor browsing only the public site never downloads the
// admin panel's bundle, and vice versa.
const About = lazy(() => import('./pages/About.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))
const Categories = lazy(() => import('./pages/Categories.jsx'))
const Designs = lazy(() => import('./pages/Designs.jsx'))
const DesignDetail = lazy(() => import('./pages/DesignDetail.jsx'))
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'))
const AdminCategories = lazy(() => import('./pages/admin/Categories.jsx'))
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'))
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'))
const AdminOffers = lazy(() => import('./pages/admin/Offers.jsx'))
const AdminSubcategories = lazy(() => import('./pages/admin/Subcategories.jsx'))
const AdminDesignTypes = lazy(() => import('./pages/admin/DesignTypes.jsx'))
const AdminCarousel = lazy(() => import('./pages/admin/CarouselSlides.jsx'))
const CategoryDetail = lazy(() => import('./pages/CategoryDetail.jsx'))

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading page">
      <div className="w-8 h-8 border-2 border-maroon/30 border-t-maroon rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen flex flex-col">
          {/* Skip link: first focusable element, visually hidden until
              focused, so keyboard/screen-reader users can bypass the nav
              instead of tabbing through it on every single page. */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50
                       focus:bg-maroon focus:text-ivory focus:px-4 focus:py-2 focus:rounded-sm"
          >
            Skip to content
          </a>
          {!isAdmin && <Navbar />}
          <main id="main-content" className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:slug" element={<CategoryDetail />} />
                <Route path="/designs" element={<Designs />} />
                <Route path="/designs/:slug" element={<DesignDetail />} />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="subcategories" element={<AdminSubcategories />} />
                  <Route path="design-types" element={<AdminDesignTypes />} />
                  <Route path="carousel" element={<AdminCarousel />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="offers" element={<AdminOffers />} />
                </Route>
              </Routes>
            </Suspense>
          </main>
          {!isAdmin && <Footer />}
        </div>
      </ToastProvider>
    </AuthProvider>
  )
}
