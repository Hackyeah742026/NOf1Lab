import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from './Button'

function navLinkClass(isActive: boolean) {
  return [
    'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
    isActive
      ? 'bg-white text-[var(--color-accent)] shadow-sm ring-1 ring-emerald-900/10'
      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
  ].join(' ')
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const email = user?.email ?? ''

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-white/65 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <Link
            to="/app"
            className="font-display shrink-0 text-lg tracking-tight text-[var(--color-ink)] sm:text-xl"
          >
            N-of-1 Lab
          </Link>

          <nav
            aria-label="App"
            className="order-3 flex w-full items-center justify-center rounded-full bg-emerald-900/5 p-1 sm:order-none sm:w-auto sm:flex-1"
          >
            <div className="flex w-full max-w-xs gap-1 sm:w-auto sm:max-w-none">
              <NavLink to="/app" end className={({ isActive }) => `${navLinkClass(isActive)} flex-1 text-center sm:flex-none`}>
                Dashboard
              </NavLink>
              <NavLink
                to="/app/templates"
                className={({ isActive }) => `${navLinkClass(isActive)} flex-1 text-center sm:flex-none`}
              >
                Templates
              </NavLink>
            </div>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            {email && (
              <span
                title={email}
                className="hidden max-w-[10rem] truncate rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] ring-1 ring-emerald-900/10 sm:inline-block md:max-w-[14rem]"
              >
                {email}
              </span>
            )}
            <Button variant="ghost" onClick={logout} className="shrink-0 px-2.5 py-1.5 text-xs sm:text-sm">
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  )
}
