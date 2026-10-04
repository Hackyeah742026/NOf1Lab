import { parseEvidence, type EvidenceStrength } from '../lib/evidence'

const strengthCopy: Record<EvidenceStrength, { label: string; chip: string; meter: number }> = {
  strong: { label: 'Strong evidence', chip: 'bg-emerald-100 text-emerald-900', meter: 3 },
  moderate: { label: 'Moderate evidence', chip: 'bg-amber-100 text-amber-900', meter: 2 },
  weak: { label: 'Weak evidence', chip: 'bg-slate-100 text-slate-700', meter: 1 },
}

const warningTitle: Record<string, string> = {
  LowSamples: 'Small sample',
  LowAdherence: 'Low adherence',
  BaselineTrend: 'Baseline was trending',
  SafetyFlags: 'Safety concern logged',
}

function signed(value: number) {
  const rounded = Math.abs(value) < 0.005 ? 0 : value
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(2)}`
}

function formatChance(pValue: number) {
  const percent = pValue * 100
  if (percent < 1) return 'under 1%'
  return `${percent.toFixed(percent < 10 ? 1 : 0)}%`
}

type ConfidencePanelProps = {
  evidenceJson?: string | null
  provisional?: boolean
  className?: string
}

export function ConfidencePanel({ evidenceJson, provisional = false, className = '' }: ConfidencePanelProps) {
  const { confidence, warnings, higherIsBetter } = parseEvidence(evidenceJson)
  if (!confidence && warnings.length === 0) return null

  const strength = confidence ? strengthCopy[confidence.strength] ?? strengthCopy.weak : null

  // Scale the CI bar symmetrically around zero so the "no change" line is always centred.
  const extent = confidence ? Math.max(Math.abs(confidence.ciLow), Math.abs(confidence.ciHigh), 0.5) * 1.15 : 1
  const toPercent = (value: number) => 50 + (value / extent) * 50
  const ciGood = confidence
    ? higherIsBetter
      ? confidence.ciLow > 0
      : confidence.ciHigh < 0
    : false
  const ciBad = confidence
    ? higherIsBetter
      ? confidence.ciHigh < 0
      : confidence.ciLow > 0
    : false
  const ciColor = ciGood ? 'bg-emerald-600' : ciBad ? 'bg-rose-500' : 'bg-slate-400'

  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">How sure is this?</p>
          <h3 className="mt-1 text-2xl text-[var(--color-ink)]">
            Confidence check{provisional && <span className="font-body text-sm text-[var(--color-subtle)]"> · so far</span>}
          </h3>
        </div>
        {strength && (
          <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${strength.chip}`}>
            <span className="flex items-end gap-0.5" aria-hidden>
              {[1, 2, 3].map((bar) => (
                <span
                  key={bar}
                  className={`w-1 rounded-sm ${bar <= strength.meter ? 'bg-current' : 'bg-current opacity-20'}`}
                  style={{ height: 4 + bar * 3 }}
                />
              ))}
            </span>
            {strength.label}
          </span>
        )}
      </div>

      {confidence && (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Could this be luck?</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
              If phase B changed nothing, randomly reshuffling your days would produce a gap this large{' '}
              <strong className="text-[var(--color-ink)]">{formatChance(confidence.pValue)}</strong> of the time.
            </p>
            <p className="mt-2 font-mono text-xs text-[var(--color-subtle)]">
              p = {confidence.pValue.toFixed(3)} · {confidence.permutations.toLocaleString()} permutations
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Likely size of the change</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
              95% range for B − A:{' '}
              <strong className="tabular-nums text-[var(--color-ink)]">
                {signed(confidence.ciLow)} to {signed(confidence.ciHigh)}
              </strong>
            </p>
            <div className="relative mt-4 h-8" aria-hidden>
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--color-line-strong)]" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[var(--color-ink)]/40" />
              <div
                className={`absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full ${ciColor}`}
                style={{
                  left: `${toPercent(confidence.ciLow)}%`,
                  width: `${Math.max(1.5, toPercent(confidence.ciHigh) - toPercent(confidence.ciLow))}%`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[0.7rem] text-[var(--color-subtle)]">
              <span>worse</span>
              <span>no change</span>
              <span>better</span>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="mt-6 space-y-2 border-t border-[var(--color-line)] pt-5">
          {warnings.map((warning) => (
            <li
              key={warning.code}
              className={`flex gap-3 rounded-xl px-4 py-3 text-sm ${warning.code === 'SafetyFlags' ? 'bg-rose-50 text-rose-950' : 'bg-amber-50 text-amber-950'}`}
            >
              <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden>
                <path
                  d="M10 3 2.5 16.5h15L10 3z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M10 8v4M10 14.2v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span>
                <strong className="font-semibold">{warningTitle[warning.code] ?? warning.code}.</strong>{' '}
                {warning.message}
              </span>
            </li>
          ))}
        </ul>
      )}
      {confidence && warnings.length === 0 && (
        <p className="mt-5 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-subtle)]">
          No data-quality issues found: enough days, good adherence, stable baseline.
        </p>
      )}
    </section>
  )
}
