import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CheckIn } from '../api/types'
import { formatDay } from '../lib/verdict'
import { Skeleton } from './Feedback'

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

function LegendItem({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {dashed ? (
        <span className="w-4 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      )}
      {label}
    </span>
  )
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
  const header = (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="eyebrow">A/B time series</p>
        <h3 className="mt-1 text-2xl text-[var(--color-ink)]">{metricLabel}</h3>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className={`card px-5 py-5 sm:px-6 ${className}`}>
        {header}
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (checkIns.length === 0) {
    return (
      <div className={`card px-5 py-5 sm:px-6 ${className}`}>
        {header}
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] text-center">
          <svg viewBox="0 0 24 24" className="mb-2 h-7 w-7 text-[var(--color-subtle)]" fill="none" aria-hidden>
            <path
              d="M4 19h16M6 15l4-4 3 3 5-6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm text-[var(--color-muted)]">The chart appears once you log check-ins.</p>
        </div>
      </div>
    )
  }

  const phaseAColor = readCssVar('--color-phase-a', '#1c6b4a')
  const phaseBColor = readCssVar('--color-phase-b', '#b0742f')
  const ink = readCssVar('--color-ink', '#12261d')
  const muted = readCssVar('--color-subtle', '#7d9186')

  const sorted = [...checkIns].sort((a, b) => a.day.localeCompare(b.day))
  const data: ChartPoint[] = sorted.map((checkIn) => ({
    day: checkIn.day,
    phase: checkIn.phase,
    metricValue: checkIn.metricValue,
    valueA: checkIn.phase === 'A' ? checkIn.metricValue : null,
    valueB: checkIn.phase === 'B' ? checkIn.metricValue : null,
  }))
  const firstB = data.find((point) => point.phase === 'B')?.day
  const lastDay = data[data.length - 1]?.day
  const hasMeanA = meanA != null && Number.isFinite(meanA)
  const hasMeanB = meanB != null && Number.isFinite(meanB)

  return (
    <div className={`card px-4 py-5 sm:px-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow">A/B time series</p>
          <h3 className="mt-1 text-2xl text-[var(--color-ink)]">{metricLabel}</h3>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[var(--color-muted)]">
          <LegendItem color={phaseAColor} label={`A · ${phaseALabel}`} />
          <LegendItem color={phaseBColor} label={`B · ${phaseBLabel}`} />
          {(hasMeanA || hasMeanB) && <LegendItem color={muted} label="Phase mean" dashed />}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
            <CartesianGrid stroke="rgba(18, 38, 29, 0.07)" vertical={false} />
            {firstB && lastDay && (
              <ReferenceArea x1={firstB} x2={lastDay} fill={phaseBColor} fillOpacity={0.06} strokeOpacity={0} />
            )}
            <XAxis
              dataKey="day"
              tick={{ fill: muted, fontSize: 11 }}
              tickFormatter={(value) => formatDay(String(value))}
              tickLine={false}
              axisLine={{ stroke: 'rgba(18, 38, 29, 0.12)' }}
              tickMargin={8}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: muted, fontSize: 11 }}
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(18, 38, 29, 0.15)' }}
              contentStyle={{
                background: '#fff',
                border: '1px solid rgba(18, 38, 29, 0.1)',
                borderRadius: 12,
                boxShadow: '0 12px 24px -12px rgba(18,38,29,0.3)',
                color: ink,
                fontSize: 13,
              }}
              formatter={(value, name) => {
                if (value == null) return ['—', String(name)]
                const label = name === 'valueA' ? phaseALabel : name === 'valueB' ? phaseBLabel : String(name)
                return [value, label]
              }}
              labelFormatter={(label) => formatDay(String(label), true)}
            />
            {hasMeanA && (
              <ReferenceLine y={meanA} stroke={phaseAColor} strokeDasharray="5 5" strokeOpacity={0.6} />
            )}
            {hasMeanB && (
              <ReferenceLine y={meanB} stroke={phaseBColor} strokeDasharray="5 5" strokeOpacity={0.6} />
            )}
            <Line
              type="monotone"
              dataKey="valueA"
              name="valueA"
              stroke={phaseAColor}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#fff', stroke: phaseAColor, strokeWidth: 2 }}
              activeDot={{ r: 5.5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="valueB"
              name="valueB"
              stroke={phaseBColor}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#fff', stroke: phaseBColor, strokeWidth: 2 }}
              activeDot={{ r: 5.5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
