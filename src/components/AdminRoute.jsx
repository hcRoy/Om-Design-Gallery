import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { canAccessAdmissions, isAdmin } from '../lib/roles.js'

/**
 * Session gate for `/admin/*`.
 * Allows admin (full panel) and staff (admissions only — enforced by
 * AdminOnlyRoute + nav filtering + RLS).
 */
export default function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading && !profile) return null

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
          notice: 'Sign in to open the office panel.',
        }}
      />
    )
  }

  if (!profile) return null

  if (!canAccessAdmissions(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

/**
 * Nested gate: admin-only pages inside `/admin`.
 * Staff users are sent to admissions.
 */
export function AdminOnlyRoute({ children }) {
  const { profile, loading } = useAuth()

  if (loading && !profile) return null
  if (!profile) return null

  if (!isAdmin(profile.role)) {
    return <Navigate to="/admin/admissions" replace />
  }

  return children
}
