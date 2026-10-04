import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-b border-emerald-900/10 bg-white/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/app" className="font-[family-name:var(--font-display)] text-xl text-[var(--color-ink)]">
            N-of-1 Lab
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/app"
              className={({ isActive }) =>
                isActive ? 'font-semibold text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
              }
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/app/templates"
              className={({ isActive }) =>
                isActive ? 'font-semibold text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
              }
            >
              Templates
            </NavLink>
            <span className="hidden text-[var(--color-muted)] sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  )
}
