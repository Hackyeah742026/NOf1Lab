import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  createExperiment,
  explainExperiment,
  fetchCheckIns,
  fetchExperiment,
  fetchResult,
  startExperiment,
} from '../api/experiments'
import { fetchTemplates } from '../api/templates'
import { AppShell } from '../components/AppShell'
import { Button, buttonClass } from '../components/Button'
import { Disclaimer } from '../components/Disclaimer'
import { MetricPhaseChart } from '../components/MetricPhaseChart'
import { StatGrid } from '../components/StatGrid'

type ResultLocationState = {
  fromShowcase?: boolean
}

export function ResultPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const fromShowcase = Boolean((location.state as ResultLocationState | null)?.fromShowcase)
  const autoExplainAttempted = useRef(false)

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

  const checkIns = useQuery({
    queryKey: ['check-ins', id],
    queryFn: () => fetchCheckIns(id),
    enabled: Boolean(id),
  })

  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })

  const explain = useMutation({
    mutationFn: () => explainExperiment(id),
  })

  const startNext = useMutation({
    mutationFn: async (templateKey: string) => {
      const created = await createExperiment(templateKey)
      return startExperiment(created.id)
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['experiments'] })
      navigate(`/app/experiments/${created.id}`)
    },
  })

  const data = result.data ?? experiment.data?.result
  const template = templates.data?.find((item) => item.key === experiment.data?.templateKey)
  const metricLabel = template?.metricLabel ?? 'Metric'
  const phaseALabel = template?.phaseALabel ?? 'Phase A'
  const phaseBLabel = template?.phaseBLabel ?? 'Phase B'
  const suggestedKey = explain.data?.suggestedNextTemplateKey ?? null
  const suggestedTemplate = suggestedKey
    ? templates.data?.find((item) => item.key === suggestedKey)
    : undefined
  const suggestedTitle = suggestedTemplate?.title ?? suggestedKey
  const shouldAutoExplain =
    Boolean(data) &&
    (experiment.data?.templateKey === 'earlier-bedtime' || fromShowcase)

  useEffect(() => {
    if (!shouldAutoExplain || autoExplainAttempted.current) return
    autoExplainAttempted.current = true
    explain.mutate()
    // Intentionally once per result view when demo/showcase conditions match.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useRef guard; mutate identity not required
  }, [shouldAutoExplain])

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

          <MetricPhaseChart
            className="animate-rise-delay mb-8"
            checkIns={checkIns.data ?? []}
            isLoading={checkIns.isPending}
            metricLabel={metricLabel}
            phaseALabel={phaseALabel}
            phaseBLabel={phaseBLabel}
            meanA={data.meanA}
            meanB={data.meanB}
          />

          <StatGrid className="animate-rise-late mb-8" stats={data} />

          <section className="mb-8 rounded-2xl border border-emerald-900/10 bg-white/80 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl">Explain my result</h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Optional AI narration with offline fallback if Gemini is unavailable.
                </p>
              </div>
              <Button
                onClick={() => explain.mutate()}
                disabled={explain.isPending}
              >
                {explain.isPending ? 'Explaining…' : 'Explain my result'}
              </Button>
            </div>
            {explain.data && (
              <>
                <p className="leading-relaxed text-[var(--color-ink)]">{explain.data.explanation}</p>
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Evidence keys: {explain.data.evidenceKeys.join(', ')}
                  {explain.data.usedFallback ? ' · offline fallback' : ''}
                </p>
                {suggestedKey && suggestedTitle && (
                  <div className="mt-5">
                    <Button
                      disabled={startNext.isPending}
                      onClick={() => startNext.mutate(suggestedKey)}
                    >
                      {startNext.isPending ? 'Starting…' : `Start: ${suggestedTitle}`}
                    </Button>
                    {startNext.isError && (
                      <p className="mt-2 text-sm text-red-700">
                        {startNext.error instanceof ApiError
                          ? startNext.error.message
                          : 'Could not start next experiment.'}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            {explain.isError && (
              <p className="text-sm text-red-700">Could not load explanation.</p>
            )}
          </section>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link to="/app/templates" className={buttonClass('primary', 'px-5 py-3')}>
              Start next experiment
            </Link>
            <Link to="/app" className={buttonClass('secondary', 'px-5 py-3')}>
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
