import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from './Button'
import { Logo } from './Logo'

function navLinkClass(isActive: boolean) {
  return [
    'flex-1 rounded-lg px-4 py-1.5 text-center text-sm font-semibold transition sm:flex-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
    isActive
      ? 'bg-white text-[var(--color-ink)] shadow-sm ring-1 ring-[var(--color-line)]'
      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
  ].join(' ')
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const email = user?.email ?? ''
  const initial = email.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Logo to="/app" />

          <nav
            aria-label="App"
            className="order-3 flex w-full rounded-xl bg-emerald-900/[0.06] p-1 sm:order-none sm:w-auto"
          >
            <NavLink to="/app" end className={({ isActive }) => navLinkClass(isActive)}>
              Dashboard
            </NavLink>
            <NavLink to="/app/templates" className={({ isActive }) => navLinkClass(isActive)}>
              Templates
            </NavLink>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            {email && (
              <div className="hidden min-w-0 items-center gap-2 sm:flex" title={email}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-bold text-[var(--color-accent)]">
                  {initial}
                </span>
                <span className="max-w-[12rem] truncate text-sm text-[var(--color-muted)]">{email}</span>
              </div>
            )}
            <Button variant="ghost" onClick={logout} className="shrink-0">
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">{children}</main>
    </div>
  )
}
