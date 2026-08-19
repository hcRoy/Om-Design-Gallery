import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Builds on ProtectedRoute's session check, adding the role gate.
 * Non-admins (including signed-out visitors) are redirected to `/` —
 * not `/login` — so an authenticated non-admin doesn't get bounced into
 * a sign-in loop for a page they're never going to be let into.
 */
export default function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) return null
  if (!session || profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}
