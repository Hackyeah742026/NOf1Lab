import { useState } from 'react'
import type { ExperimentPhase } from '../api/types'

type PhaseProgressProps = {
  startDate?: string | null
  phaseAEnd?: string | null
  endDate?: string | null
  phaseALabel?: string
  phaseBLabel?: string
  className?: string
}

function parseDay(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

export function PhaseProgress({
  startDate,
  phaseAEnd,
  endDate,
  phaseALabel = 'Phase A',
  phaseBLabel = 'Phase B',
  className = '',
}: PhaseProgressProps) {
  const [today] = useState(() => {
    const now = new Date()
    now.setHours(12, 0, 0, 0)
    return now
  })

  const start = parseDay(startDate)
  const phaseEnd = parseDay(phaseAEnd)
  const finish = parseDay(endDate)

  if (!start || !phaseEnd || !finish) {
    return (
      <div
        className={`rounded-2xl border border-emerald-900/10 bg-white/70 px-5 py-4 ${className}`}
      >
        <p className="text-sm text-[var(--color-muted)]">
          Protocol window appears after the experiment starts.
        </p>
      </div>
    )
  }

  const totalDays = Math.max(1, daysBetween(start, finish) + 1)
  const elapsedDays = Math.min(totalDays, Math.max(1, daysBetween(start, today) + 1))
  const phaseADays = Math.max(1, daysBetween(start, phaseEnd) + 1)
  const currentPhase: ExperimentPhase = today <= phaseEnd ? 'A' : 'B'
  const phaseLabel = currentPhase === 'A' ? phaseALabel : phaseBLabel
  const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
  const phaseAWidth = Math.min(100, Math.round((phaseADays / totalDays) * 100))

  return (
    <div
      className={`rounded-2xl border border-emerald-900/10 bg-white/70 px-5 py-5 ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Protocol coach
          </p>
          <p className="mt-1 text-2xl text-[var(--color-ink)]">
            Day {elapsedDays}
            <span className="text-base font-normal text-[var(--color-muted)]">
              {' '}
              of {totalDays}
            </span>
          </p>
        </div>
        <span className="rounded-md bg-[var(--color-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--color-accent)]">
          Phase {currentPhase}: {phaseLabel}
        </span>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-emerald-900/10">
        <div
          className="absolute inset-y-0 left-0 bg-emerald-900/10"
          style={{ width: `${phaseAWidth}%` }}
          aria-hidden
        />
        <div
          className="relative h-full rounded-full bg-[var(--color-accent)] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[var(--color-muted)]">
        <span>
          A · {phaseALabel} through {phaseAEnd}
        </span>
        <span>
          B · {phaseBLabel} through {endDate}
        </span>
      </div>
    </div>
  )
}
