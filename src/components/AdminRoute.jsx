import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Builds on ProtectedRoute's session check, adding the role gate.
 * Once bootstrapped, never unmounts children for background auth refresh —
 * only redirects when session/role actually changes.
 */
export default function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) return null

  if (!session) return <Navigate to="/" replace />

  // After login, profile may still be in flight — wait without unmounting
  // an already-rendered tree (only applies before first profile load).
  if (!profile) return null

  if (profile.role !== 'admin') return <Navigate to="/" replace />

  return children
}
