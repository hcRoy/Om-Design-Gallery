import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Session + admin role gate.
 *
 * After the first successful bootstrap, never unmount children for
 * background auth noise — that was closing open admin modals when
 * users switched browser tabs and returned.
 */
export default function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth()

  // Initial bootstrap only — once we have an admin profile, keep the
  // tree mounted even if session/profile briefly update in the background.
  if (loading && !profile) return null

  if (!session) return <Navigate to="/" replace />

  // Right after login, wait for profile without redirecting.
  if (!profile) return null

  if (profile.role !== 'admin') return <Navigate to="/" replace />

  return children
}
