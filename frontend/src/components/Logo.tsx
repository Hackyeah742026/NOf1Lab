import { Link } from 'react-router-dom'

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--color-accent)" />
      <rect x="8" y="14" width="6" height="11" rx="2" fill="#dcefe4" />
      <rect x="18" y="7" width="6" height="18" rx="2" fill="#f2c98f" />
    </svg>
  )
}

export function Logo({ to = '/', className = '' }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] ${className}`}
    >
      <LogoMark />
      <span className="font-display text-xl tracking-tight text-[var(--color-ink)]">N-of-1 Lab</span>
    </Link>
  )
}
