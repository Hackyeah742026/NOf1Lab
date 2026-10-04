import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { explainExperiment, fetchExperiment, fetchResult } from '../api/experiments'
import { AppShell } from '../components/AppShell'
import { Disclaimer } from '../components/Disclaimer'

export function ResultPage() {
  const { id = '' } = useParams()

  const experiment = useQuery({
    queryKey: ['experiment', id],
    queryFn: () => fetchExperiment(id),
    enabled: Boolean(id),
  })

  const result = useQuery({
    queryKey: ['result', id],
    queryFn: () => fetchResult(id),
    enabled: Boolean(id),
    retry: false,
  })

  const explain = useMutation({
    mutationFn: () => explainExperiment(id),
  })

  const data = result.data ?? experiment.data?.result

  return (
    <AppShell>
      <section className="animate-rise mb-8">
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Computed verdict
        </p>
        <h1 className="mt-2 mb-3 text-4xl text-[var(--color-ink)] md:text-5xl">
          {experiment.data?.templateTitle ?? 'Experiment result'}
        </h1>
        <p className="max-w-2xl text-lg text-[var(--color-muted)]">
          {experiment.data?.hypothesis}
        </p>
      </section>

      {result.isPending && !data && <p className="text-[var(--color-muted)]">Loading result…</p>}
      {!data && !result.isPending && (
        <p className="text-[var(--color-muted)]">
          No result yet.{' '}
          <Link to={`/app/experiments/${id}`} className="font-semibold text-[var(--color-accent)]">
            Back to experiment
          </Link>
        </p>
      )}

      {data && (
        <>
          <section className="animate-rise-delay mb-8 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[var(--color-panel)] p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted)]">Verdict</p>
            <p className="mt-3 text-6xl text-[var(--color-accent)] md:text-7xl">{data.verdict}</p>
            <p className="mt-4 max-w-xl text-sm text-[var(--color-muted)]">
              The verdict is produced by the stats engine from your check-ins. AI can only narrate
              these numbers — it never invents them.
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-emerald-900/10">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(8, Math.abs(data.effectSize) * 40))}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Effect size magnitude (visual only): {data.effectSize}
            </p>
          </section>

          <section className="animate-rise-late mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Mean A" value={data.meanA} />
            <Stat label="Mean B" value={data.meanB} />
            <Stat label="Delta" value={data.delta} />
            <Stat label="Effect size" value={data.effectSize} />
            <Stat label="Adherence A" value={`${data.adherenceA}%`} />
            <Stat label="Adherence B" value={`${data.adherenceB}%`} />
            <Stat label="Samples A" value={data.sampleSizeA} />
            <Stat label="Samples B" value={data.sampleSizeB} />
          </section>

          <section className="mb-8 rounded-2xl border border-emerald-900/10 bg-white/80 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl">Explain my result</h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Optional AI narration with offline fallback if Gemini is unavailable.
                </p>
              </div>
              <button
                type="button"
                onClick={() => explain.mutate()}
                disabled={explain.isPending}
                className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {explain.isPending ? 'Explaining…' : 'Explain my result'}
              </button>
            </div>
            {explain.data && (
              <>
                <p className="leading-relaxed text-[var(--color-ink)]">{explain.data.explanation}</p>
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Evidence keys: {explain.data.evidenceKeys.join(', ')}
                  {explain.data.usedFallback ? ' · offline fallback' : ''}
                </p>
                {explain.data.suggestedNextTemplateKey && (
                  <Link
                    to="/app/templates"
                    className="mt-4 inline-block text-sm font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    Suggested next: {explain.data.suggestedNextTemplateKey}
                  </Link>
                )}
              </>
            )}
            {explain.isError && (
              <p className="text-sm text-red-700">Could not load explanation.</p>
            )}
          </section>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              to="/app/templates"
              className="rounded-md bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Start next experiment
            </Link>
            <Link
              to="/app"
              className="rounded-md bg-[var(--color-accent-soft)] px-5 py-3 text-sm font-semibold"
            >
              Dashboard
            </Link>
          </div>

          <details className="rounded-xl border border-emerald-900/10 bg-white/60 p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Evidence JSON</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-[var(--color-muted)]">
              {JSON.stringify(JSON.parse(data.evidenceJson), null, 2)}
            </pre>
          </details>
        </>
      )}

      <Disclaimer className="mt-10" />
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-emerald-900/10 bg-white/75 px-4 py-4">
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  )
}
