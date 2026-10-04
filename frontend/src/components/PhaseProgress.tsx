import { useState } from 'react'
import type { ExperimentPhase } from '../api/types'
import { formatDay } from '../lib/verdict'

type PhaseProgressProps = {
  startDate?: string | null
  phaseAEnd?: string | null
  endDate?: string | null
  phaseALabel?: string
  phaseBLabel?: string
  className?: string
}

/** UTC calendar day as YYYY-MM-DD — matches API DateOnly.FromDateTime(DateTime.UtcNow). */
function utcTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseDay(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(`${value}T12:00:00.000Z`)
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
  const [today] = useState(() => parseDay(utcTodayString())!)

  const start = parseDay(startDate)
  const phaseEnd = parseDay(phaseAEnd)
  const finish = parseDay(endDate)

  if (!start || !phaseEnd || !finish) {
    return (
      <div className={`card-muted px-5 py-4 ${className}`}>
        <p className="text-sm text-[var(--color-muted)]">
          The protocol timeline appears once the experiment starts.
        </p>
      </div>
    )
  }

  const totalDays = Math.max(1, daysBetween(start, finish) + 1)
  const elapsedDays = Math.min(totalDays, Math.max(1, daysBetween(start, today) + 1))
  const phaseADays = Math.min(totalDays, Math.max(1, daysBetween(start, phaseEnd) + 1))
  const phaseBDays = totalDays - phaseADays
  const currentPhase: ExperimentPhase = today <= phaseEnd ? 'A' : 'B'
  const phaseLabel = currentPhase === 'A' ? phaseALabel : phaseBLabel
  const fillA = Math.min(phaseADays, elapsedDays) / phaseADays
  const fillB = phaseBDays > 0 ? Math.max(0, elapsedDays - phaseADays) / phaseBDays : 0
  const daysLeft = totalDays - elapsedDays

  return (
    <div className={`card px-5 py-5 sm:px-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Protocol timeline</p>
          <p className="mt-1 font-display text-3xl text-[var(--color-ink)]">
            Day {elapsedDays}
            <span className="font-body text-base font-normal text-[var(--color-muted)]"> of {totalDays}</span>
          </p>
        </div>
        <div className="sm:text-right">
          <span
            className={[
              'inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold',
              currentPhase === 'A'
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-phase-a)]'
                : 'bg-[var(--color-phase-b-soft)] text-[var(--color-phase-b)]',
            ].join(' ')}
          >
            Now: {currentPhase} · {phaseLabel}
          </span>
          <p className="mt-1 text-xs text-[var(--color-subtle)]">
            {daysLeft === 0 ? 'Final day — ready to compute' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
          </p>
        </div>
      </div>

      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-label="Protocol progress"
        aria-valuemin={1}
        aria-valuemax={totalDays}
        aria-valuenow={elapsedDays}
      >
        <div
          className="h-3 overflow-hidden rounded-full bg-[var(--color-accent-soft)]"
          style={{ flexGrow: phaseADays, flexBasis: 0 }}
        >
          <div
            className="h-full rounded-full bg-[var(--color-phase-a)] transition-all duration-700"
            style={{ width: `${fillA * 100}%` }}
          />
        </div>
        {phaseBDays > 0 && (
          <div
            className="h-3 overflow-hidden rounded-full bg-[var(--color-phase-b-soft)]"
            style={{ flexGrow: phaseBDays, flexBasis: 0 }}
          >
            <div
              className="h-full rounded-full bg-[var(--color-phase-b)] transition-all duration-700"
              style={{ width: `${fillB * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[var(--color-muted)]">
        <span>
          <strong className="text-[var(--color-phase-a)]">A</strong> · {phaseALabel} · until{' '}
          {formatDay(phaseAEnd)}
        </span>
        <span>
          <strong className="text-[var(--color-phase-b)]">B</strong> · {phaseBLabel} · until{' '}
          {formatDay(endDate)}
        </span>
      </div>
    </div>
  )
}
