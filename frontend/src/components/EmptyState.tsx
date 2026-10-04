import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  message: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, message, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-[var(--color-line-strong)] bg-white/60 px-6 py-14 text-center ${className}`}
    >
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--color-accent)]" fill="none" aria-hidden>
          <path
            d="M9 3h6M10 3v6l-5.2 8.7A2.2 2.2 0 0 0 6.7 21h10.6a2.2 2.2 0 0 0 1.9-3.3L14 9V3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M7.5 15h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-2xl text-[var(--color-ink)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        {message}
      </p>
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
