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
import { ConfidencePanel } from '../components/ConfidencePanel'
import { Disclaimer } from '../components/Disclaimer'
import { Alert, Skeleton } from '../components/Feedback'
import { MetricPhaseChart } from '../components/MetricPhaseChart'
import { StatGrid } from '../components/StatGrid'
import { formatDay, verdictTone } from '../lib/verdict'

type ResultLocationState = {
  fromShowcase?: boolean
}

function prettyEvidence(json: string) {
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
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
  const shouldAutoExplain = Boolean(data) && fromShowcase
  const tone = data ? verdictTone[data.verdict] : null
  const exp = experiment.data

  useEffect(() => {
    if (!shouldAutoExplain || autoExplainAttempted.current) return
    autoExplainAttempted.current = true
    explain.mutate()
    // Intentionally once per result view when opened from the showcase / demo hop.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useRef guard; mutate identity not required
  }, [shouldAutoExplain])

  return (
    <AppShell>
      <Link
        to="/app"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        ← Dashboard
      </Link>

      {result.isPending && !data && (
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-80" />
        </div>
      )}
      {!data && !result.isPending && (
        <Alert tone="info">
          No result yet.{' '}
          <Link to={`/app/experiments/${id}`} className="font-semibold text-[var(--color-accent)] hover:underline">
            Back to experiment
          </Link>
        </Alert>
      )}

      {data && tone && (
        <>
          <section
            className={`card animate-rise mb-6 overflow-hidden bg-gradient-to-br ${tone.panel} p-6 sm:p-8 md:p-10`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">Computed verdict</p>
              {exp?.startDate && exp.endDate && (
                <span className="text-xs text-[var(--color-subtle)]">
                  · {formatDay(exp.startDate)} – {formatDay(exp.endDate, true)}
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className="min-w-0">
                <h1 className="text-3xl leading-tight text-[var(--color-ink)] md:text-4xl">
                  {exp?.templateTitle ?? 'Experiment result'}
                </h1>
                {exp?.hypothesis && (
                  <p className="mt-2 max-w-2xl text-[var(--color-muted)]">“{exp.hypothesis}”</p>
                )}
              </div>
              <div className="md:text-right">
                <p className={`font-display text-7xl leading-none md:text-8xl ${tone.text}`}>{data.verdict}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--color-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-relaxed text-[var(--color-ink)]">{tone.summary}</p>
              <p className="max-w-xs text-xs leading-relaxed text-[var(--color-subtle)] sm:text-right">
                Computed by the stats engine from your check-ins. AI only narrates these numbers.
              </p>
            </div>
          </section>

          <StatGrid
            className="animate-rise-delay mb-6"
            stats={data}
            phaseALabel={phaseALabel}
            phaseBLabel={phaseBLabel}
          />

          <ConfidencePanel className="animate-rise-delay mb-6" evidenceJson={data.evidenceJson} />

          <MetricPhaseChart
            className="animate-rise-delay mb-6"
            checkIns={checkIns.data ?? []}
            isLoading={checkIns.isPending}
            metricLabel={metricLabel}
            phaseALabel={phaseALabel}
            phaseBLabel={phaseBLabel}
            meanA={data.meanA}
            meanB={data.meanB}
          />

          <section className="card animate-rise-late mb-6 p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                    <path
                      d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-2xl text-[var(--color-ink)]">Explain my result</h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Plain-language narration of the numbers above, with an offline fallback.
                  </p>
                </div>
              </div>
              {!explain.data && (
                <Button onClick={() => explain.mutate()} disabled={explain.isPending}>
                  {explain.isPending ? 'Explaining…' : 'Explain'}
                </Button>
              )}
            </div>

            {explain.isPending && (
              <div className="mt-5 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}

            {explain.data && (
              <div className="mt-5">
                <p className="whitespace-pre-line leading-relaxed text-[var(--color-ink)]">
                  {explain.data.explanation}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {explain.data.evidenceKeys.map((key) => (
                    <span
                      key={key}
                      className="rounded-md bg-[var(--color-surface-muted)] px-2 py-0.5 font-mono text-[0.7rem] text-[var(--color-muted)] ring-1 ring-inset ring-[var(--color-line)]"
                    >
                      {key}
                    </span>
                  ))}
                  {explain.data.usedFallback && (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[0.7rem] font-semibold text-amber-900">
                      offline fallback
                    </span>
                  )}
                </div>

                {suggestedKey && suggestedTitle && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--color-accent-soft)]/60 p-4">
                    <div>
                      <p className="eyebrow">Suggested next experiment</p>
                      <p className="mt-1 font-display text-xl text-[var(--color-ink)]">{suggestedTitle}</p>
                    </div>
                    <Button disabled={startNext.isPending} onClick={() => startNext.mutate(suggestedKey)}>
                      {startNext.isPending ? 'Starting…' : 'Start it now'}
                    </Button>
                    {startNext.isError && (
                      <Alert className="w-full">
                        {startNext.error instanceof ApiError
                          ? startNext.error.message
                          : 'Could not start next experiment.'}
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
            {explain.isError && <Alert className="mt-4">Could not load explanation.</Alert>}
          </section>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link to="/app/templates" className={buttonClass('primary', 'px-5 py-3')}>
              Start next experiment
            </Link>
            <Link to="/app" className={buttonClass('secondary', 'px-5 py-3')}>
              Back to dashboard
            </Link>
          </div>

          <details className="card-muted group p-4 text-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-[var(--color-muted)]">
              Evidence JSON
              <span className="text-xs transition group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-line)]">
              {prettyEvidence(data.evidenceJson)}
            </pre>
          </details>
        </>
      )}

      <Disclaimer className="mt-10" />
    </AppShell>
  )
}
