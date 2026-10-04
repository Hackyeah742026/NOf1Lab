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
      className={`rounded-2xl border border-dashed border-emerald-900/15 bg-white/55 px-6 py-10 text-center ${className}`}
    >
      <h2 className="text-2xl text-[var(--color-ink)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        {message}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
