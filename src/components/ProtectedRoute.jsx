import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Reused as-is in Phase 5 for /admin, with an added role==='admin' check
 * layered on top of the session check here.
 */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return null // avoid a flash-redirect before session resolves
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
