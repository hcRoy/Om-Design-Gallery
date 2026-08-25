import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Session gate for authenticated pages.
 * `loading` is bootstrap-only, so tab-focus token refresh does not
 * blank the page or wipe local UI state.
 */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
