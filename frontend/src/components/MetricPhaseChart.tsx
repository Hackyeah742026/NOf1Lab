import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CheckIn } from '../api/types'

type MetricPhaseChartProps = {
  checkIns: CheckIn[]
  /** When true, show a loading placeholder instead of the empty-state copy. */
  isLoading?: boolean
  metricLabel?: string
  phaseALabel?: string
  phaseBLabel?: string
  meanA?: number | null
  meanB?: number | null
  className?: string
}

function formatDayLabel(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day
  const date = new Date(`${day}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return day
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

type ChartPoint = {
  day: string
  phase: 'A' | 'B'
  valueA: number | null
  valueB: number | null
  metricValue: number
}

function readCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export function MetricPhaseChart({
  checkIns,
  isLoading = false,
  metricLabel = 'Metric',
  phaseALabel = 'Phase A',
  phaseBLabel = 'Phase B',
  meanA,
  meanB,
  className = '',
}: MetricPhaseChartProps) {
  if (isLoading) {
    return (
      <div
        className={`rounded-2xl border border-emerald-900/10 bg-white/70 px-5 py-8 text-center ${className}`}
      >
        <p className="text-sm text-[var(--color-muted)]">Loading chart…</p>
      </div>
    )
  }

  if (checkIns.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-emerald-900/10 bg-white/70 px-5 py-8 text-center ${className}`}
      >
        <p className="text-sm text-[var(--color-muted)]">
          Chart appears once you log check-ins.
        </p>
      </div>
    )
  }

  const accent = readCssVar('--color-accent', '#1c6b4a')
  const ink = readCssVar('--color-ink', '#13281f')
  const muted = readCssVar('--color-muted', '#4a6658')
  const phaseBColor = '#8a6a3d'

  const sorted = [...checkIns].sort((a, b) => a.day.localeCompare(b.day))
  const data: ChartPoint[] = sorted.map((checkIn) => ({
    day: checkIn.day,
    phase: checkIn.phase,
    metricValue: checkIn.metricValue,
    valueA: checkIn.phase === 'A' ? checkIn.metricValue : null,
    valueB: checkIn.phase === 'B' ? checkIn.metricValue : null,
  }))

  return (
    <div
      className={`rounded-2xl border border-emerald-900/10 bg-white/80 px-4 py-5 shadow-sm md:px-5 ${className}`}
    >
      <div className="mb-4 px-1">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
          A/B time series
        </p>
        <h3 className="mt-1 text-2xl text-[var(--color-ink)]">{metricLabel}</h3>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="rgba(19, 40, 31, 0.08)" strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tick={{ fill: muted, fontSize: 11 }}
              tickMargin={8}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: muted, fontSize: 11 }}
              domain={['auto', 'auto']}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(19, 40, 31, 0.12)',
                borderRadius: 10,
                color: ink,
              }}
              formatter={(value, name) => {
                if (value == null) return ['—', String(name)]
                const label =
                  name === 'valueA' ? phaseALabel : name === 'valueB' ? phaseBLabel : String(name)
                return [value, label]
              }}
              labelFormatter={(label) => formatDayLabel(String(label))}
            />
            <Legend
              formatter={(value) =>
                value === 'valueA' ? phaseALabel : value === 'valueB' ? phaseBLabel : value
              }
            />
            {meanA != null && Number.isFinite(meanA) && (
              <ReferenceLine
                y={meanA}
                stroke={accent}
                strokeDasharray="4 4"
                strokeOpacity={0.55}
                label={{
                  value: 'Mean A',
                  fill: muted,
                  fontSize: 11,
                  position: 'insideTopRight',
                }}
              />
            )}
            {meanB != null && Number.isFinite(meanB) && (
              <ReferenceLine
                y={meanB}
                stroke={phaseBColor}
                strokeDasharray="4 4"
                strokeOpacity={0.55}
                label={{
                  value: 'Mean B',
                  fill: muted,
                  fontSize: 11,
                  position: 'insideBottomRight',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="valueA"
              name="valueA"
              stroke={accent}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: accent }}
              connectNulls={false}
              isAnimationActive
            />
            <Line
              type="monotone"
              dataKey="valueB"
              name="valueB"
              stroke={phaseBColor}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: phaseBColor }}
              connectNulls={false}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
