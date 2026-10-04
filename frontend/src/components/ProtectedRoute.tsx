import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LogoMark } from './Logo'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <LogoMark className="h-10 w-10 animate-pulse" />
        <p className="text-sm text-[var(--color-muted)]">Loading your lab…</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
