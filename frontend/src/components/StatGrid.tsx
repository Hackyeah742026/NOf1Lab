import type { AnalysisStats } from '../api/types'

type StatGridProps = {
  stats: AnalysisStats
  provisional?: boolean
  phaseALabel?: string
  phaseBLabel?: string
  className?: string
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function AdherenceBar({ label, value, colorVar }: { label: string; value: number; colorVar: string }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-[var(--color-muted)]">{label}</span>
        <span className="font-semibold tabular-nums text-[var(--color-ink)]">{formatNumber(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-emerald-900/[0.07]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${width}%`, background: `var(${colorVar})` }}
        />
      </div>
    </div>
  )
}

function PhaseMean({
  phase,
  label,
  mean,
  samples,
}: {
  phase: 'A' | 'B'
  label: string
  mean: number
  samples: number
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: phase === 'A' ? 'var(--color-phase-a)' : 'var(--color-phase-b)' }}
        />
        <span className="truncate">
          {phase} · {label}
        </span>
      </p>
      <p className="mt-1 font-display text-4xl tabular-nums text-[var(--color-ink)]">{formatNumber(mean)}</p>
      <p className="text-xs text-[var(--color-subtle)]">mean · {samples} days</p>
    </div>
  )
}

export function StatGrid({
  stats,
  provisional = false,
  phaseALabel = 'Phase A',
  phaseBLabel = 'Phase B',
  className = '',
}: StatGridProps) {
  const deltaZero = stats.delta === 0
  const deltaPositive = stats.delta > 0
  const relative = stats.meanA !== 0 ? (stats.delta / Math.abs(stats.meanA)) * 100 : null
  const deltaTone = deltaZero
    ? 'bg-slate-100 text-slate-700'
    : deltaPositive
      ? 'bg-emerald-50 text-emerald-800'
      : 'bg-rose-50 text-rose-800'

  return (
    <section className={className}>
      {provisional && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-amber-900">
            Provisional
          </span>
          <p className="text-xs text-[var(--color-muted)]">
            Mid-run preview — complete the experiment for a final verdict.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5 sm:p-6">
          <p className="eyebrow">Baseline vs. change</p>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <PhaseMean phase="A" label={phaseALabel} mean={stats.meanA} samples={stats.sampleSizeA} />
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--color-subtle)]" fill="none" aria-hidden>
              <path
                d="M5 12h14m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <PhaseMean phase="B" label={phaseBLabel} mean={stats.meanB} samples={stats.sampleSizeB} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${deltaTone}`}
            >
              {deltaZero ? '±' : deltaPositive ? '▲' : '▼'} {formatNumber(Math.abs(stats.delta))}
              {relative != null && !deltaZero && (
                <span className="font-semibold opacity-75">
                  ({deltaPositive ? '+' : '−'}
                  {Math.abs(relative).toFixed(0)}%)
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-muted)] px-2.5 py-1 text-sm text-[var(--color-muted)] ring-1 ring-inset ring-[var(--color-line)]">
              Effect size
              <strong className="tabular-nums text-[var(--color-ink)]">{formatNumber(stats.effectSize)}</strong>
            </span>
          </div>
        </div>

        <div className="card flex flex-col justify-center gap-4 p-5 sm:p-6">
          <p className="eyebrow">Protocol adherence</p>
          <AdherenceBar label={`A · ${phaseALabel}`} value={stats.adherenceA} colorVar="--color-phase-a" />
          <AdherenceBar label={`B · ${phaseBLabel}`} value={stats.adherenceB} colorVar="--color-phase-b" />
        </div>
      </div>
    </section>
  )
}
