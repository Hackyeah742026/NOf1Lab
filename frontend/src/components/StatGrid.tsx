import type { AnalysisStats } from '../api/types'

type StatGridProps = {
  stats: AnalysisStats
  provisional?: boolean
  className?: string
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function StatGrid({ stats, provisional = false, className = '' }: StatGridProps) {
  const items: { label: string; value: string }[] = [
    { label: 'Mean A', value: formatNumber(stats.meanA) },
    { label: 'Mean B', value: formatNumber(stats.meanB) },
    { label: 'Delta', value: formatNumber(stats.delta) },
    { label: 'Effect size', value: formatNumber(stats.effectSize) },
    { label: 'Adherence A', value: `${formatNumber(stats.adherenceA)}%` },
    { label: 'Adherence B', value: `${formatNumber(stats.adherenceB)}%` },
    { label: 'Samples A', value: String(stats.sampleSizeA) },
    { label: 'Samples B', value: String(stats.sampleSizeB) },
  ]

  return (
    <section className={className}>
      {provisional && (
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-950">
            Provisional
          </span>
          <p className="text-xs text-[var(--color-muted)]">
            Mid-run preview — complete the experiment for a final verdict.
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-emerald-900/10 bg-white/75 px-4 py-4"
          >
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
