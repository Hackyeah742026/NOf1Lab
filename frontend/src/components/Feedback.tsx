import type { ReactNode } from 'react'

type Tone = 'error' | 'warning' | 'info'

const toneClass: Record<Tone, string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-emerald-900/10 bg-[var(--color-surface-muted)] text-[var(--color-muted)]',
}

export function Alert({
  tone = 'error',
  children,
  className = '',
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${toneClass[tone]} ${className}`}
    >
      {children}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="animate-rise mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-4xl leading-tight text-[var(--color-ink)] md:text-[2.75rem]">{title}</h1>
        {description && (
          <p className="mt-2 text-base leading-relaxed text-[var(--color-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  )
}
