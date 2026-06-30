import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)

  if (!user && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function AuthRoute() {
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)

  if (user || isGuest) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
