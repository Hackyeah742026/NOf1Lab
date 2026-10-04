import type { ExperimentStatus, Verdict } from '../api/types'
import { statusTone, verdictTone } from '../lib/verdict'

const chipBase =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide ring-1 ring-inset'

export function StatusBadge({ status, className = '' }: { status: ExperimentStatus; className?: string }) {
  const tone = statusTone[status]
  return (
    <span className={`${chipBase} ${tone.chip} ${className}`}>
      <span className="relative flex h-1.5 w-1.5">
        {status === 'Active' && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${tone.dot}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      </span>
      {status}
    </span>
  )
}

export function VerdictBadge({
  verdict,
  provisional = false,
  className = '',
}: {
  verdict: Verdict
  provisional?: boolean
  className?: string
}) {
  const tone = verdictTone[verdict]
  return (
    <span className={`${chipBase} uppercase ${tone.chip} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {verdict}
      {provisional && <span className="font-semibold normal-case opacity-70">· provisional</span>}
    </span>
  )
}

export function PhaseBadge({ phase }: { phase: 'A' | 'B' }) {
  return (
    <span
      className={[
        'inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold',
        phase === 'A'
          ? 'bg-[var(--color-accent-soft)] text-[var(--color-phase-a)]'
          : 'bg-[var(--color-phase-b-soft)] text-[var(--color-phase-b)]',
      ].join(' ')}
      aria-label={`Phase ${phase}`}
    >
      {phase}
    </span>
  )
}
