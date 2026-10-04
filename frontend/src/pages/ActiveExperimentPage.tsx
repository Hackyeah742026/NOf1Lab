import { useState, type CSSProperties, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  completeExperiment,
  createCheckIn,
  fetchCheckIns,
  fetchExperiment,
  fetchPreviewAnalysis,
  importCheckIns,
  startExperiment,
  stopExperiment,
} from '../api/experiments'
import { fetchTemplates } from '../api/templates'
import { ApiError } from '../api/client'
import { AppShell } from '../components/AppShell'
import { PhaseBadge, StatusBadge, VerdictBadge } from '../components/Badge'
import { Button, buttonClass } from '../components/Button'
import { ConfidencePanel } from '../components/ConfidencePanel'
import { Disclaimer } from '../components/Disclaimer'
import { Alert, Skeleton } from '../components/Feedback'
import { MetricPhaseChart } from '../components/MetricPhaseChart'
import { PhaseProgress } from '../components/PhaseProgress'
import { StatGrid } from '../components/StatGrid'
import { currentStreak, findTodayCheckIn } from '../lib/streak'
import { formatDay } from '../lib/verdict'

const SAMPLE_CSV_PATH = '/samples/earlier-bedtime-demo.csv'

export function ActiveExperimentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [metricValue, setMetricValue] = useState(7)
  const [adhered, setAdhered] = useState(true)
  const [notes, setNotes] = useState('')
  const [safetyFlag, setSafetyFlag] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stopReason, setStopReason] = useState('')
  const [showStopPrompt, setShowStopPrompt] = useState(false)

  const experiment = useQuery({
    queryKey: ['experiment', id],
    queryFn: () => fetchExperiment(id),
    enabled: Boolean(id),
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

  const template = templates.data?.find((item) => item.key === experiment.data?.templateKey)
  const status = experiment.data?.status
  const hasCheckIns = (checkIns.data?.length ?? 0) > 0
  const previewEnabled =
    Boolean(id) &&
    hasCheckIns &&
    (status === 'Active' || status === 'Stopped')

  const preview = useQuery({
    queryKey: ['analysis-preview', id],
    queryFn: () => fetchPreviewAnalysis(id),
    enabled: previewEnabled,
    retry: false,
  })

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['experiment', id] }),
      queryClient.invalidateQueries({ queryKey: ['check-ins', id] }),
      queryClient.invalidateQueries({ queryKey: ['experiments'] }),
      queryClient.invalidateQueries({ queryKey: ['analysis-preview', id] }),
    ])
  }

  const start = useMutation({
    mutationFn: () => startExperiment(id),
    onSuccess: refresh,
  })

  const stop = useMutation({
    mutationFn: (reason?: string) => stopExperiment(id, reason),
    onSuccess: async () => {
      setShowStopPrompt(false)
      setStopReason('')
      await refresh()
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Stop failed.')
    },
  })

  const addCheckIn = useMutation({
    mutationFn: () =>
      createCheckIn(id, { metricValue, adhered, notes: notes || undefined, safetyFlag }),
    onSuccess: async () => {
      setNotes('')
      setSafetyFlag(false)
      setError(null)
      await refresh()
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Check-in failed.')
    },
  })

  const complete = useMutation({
    mutationFn: () => completeExperiment(id),
    onSuccess: async () => {
      await refresh()
      navigate(`/app/experiments/${id}/result`)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Complete failed.')
    },
  })

  const importCsv = useMutation({
    mutationFn: (file: File) => importCheckIns(id, file),
    onSuccess: refresh,
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Import failed.')
    },
  })

  const data = experiment.data
  const metricLabel = template?.metricLabel ?? 'Metric'
  const phaseALabel = template?.phaseALabel ?? 'Phase A'
  const phaseBLabel = template?.phaseBLabel ?? 'Phase B'
  const previewMissingPhases =
    preview.error instanceof ApiError && preview.error.code === 'Analysis.MissingPhases'
  const canLog = data?.status === 'Active' || data?.status === 'Draft'
  const todayCheckIn = data?.status === 'Active' ? findTodayCheckIn(checkIns.data) : undefined
  const streak = currentStreak(checkIns.data)
  const recentCheckIns = [...(checkIns.data ?? [])].sort((a, b) => b.day.localeCompare(a.day))

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    addCheckIn.mutate()
  }

  function confirmStop() {
    const reason = stopReason.trim()
    stop.mutate(reason || undefined)
  }

  async function loadSampleData() {
    setError(null)
    try {
      const response = await fetch(SAMPLE_CSV_PATH)
      if (!response.ok) {
        throw new Error('Sample CSV not found.')
      }
      const blob = await response.blob()
      const file = new File([blob], 'earlier-bedtime-demo.csv', { type: 'text/csv' })
      importCsv.mutate(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sample data.')
    }
  }

  return (
    <AppShell>
      <Link
        to="/app"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        ← Dashboard
      </Link>

      {experiment.isPending && (
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-80" />
        </div>
      )}
      {experiment.isError && <Alert>Experiment not found.</Alert>}

      {data && (
        <>
          <section className="card animate-rise mb-6 p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={data.status} />
                  {data.result && <VerdictBadge verdict={data.result.verdict} />}
                </div>
                <h1 className="mt-3 text-4xl leading-tight text-[var(--color-ink)] md:text-5xl">
                  {data.templateTitle ?? data.templateKey}
                </h1>
                <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
                  {data.hypothesis}
                </p>
                {template && (
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-lg bg-[var(--color-surface-muted)] px-2.5 py-1 text-[var(--color-muted)] ring-1 ring-inset ring-[var(--color-line)]">
                      Tracking <strong className="text-[var(--color-ink)]">{metricLabel}</strong>
                    </span>
                    <span className="rounded-lg bg-[var(--color-accent-soft)]/70 px-2.5 py-1 font-semibold text-[var(--color-phase-a)]">
                      A · {phaseALabel}
                    </span>
                    <span className="rounded-lg bg-[var(--color-phase-b-soft)] px-2.5 py-1 font-semibold text-[var(--color-phase-b)]">
                      B · {phaseBLabel}
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-[var(--color-accent-soft)]/60 px-5 py-4 text-center">
                <p className="eyebrow">Check-ins</p>
                <p className="font-display text-4xl tabular-nums text-[var(--color-accent)]">{data.checkInCount}</p>
              </div>
            </div>

            {data.stopReason && (
              <Alert tone="warning" className="mt-5">
                <strong>Stopped:</strong> {data.stopReason}
              </Alert>
            )}
            {data.status === 'Stopped' && !data.result && (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Protocol paused. Finalize with Complete to compute a verdict from the check-ins you already
                logged.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2.5 border-t border-[var(--color-line)] pt-5">
              {data.status === 'Draft' && (
                <Button onClick={() => start.mutate()} disabled={start.isPending}>
                  {start.isPending ? 'Starting…' : 'Start protocol'}
                </Button>
              )}
              {(data.status === 'Active' || (data.status === 'Stopped' && !data.result)) && (
                <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
                  {complete.isPending ? 'Completing…' : 'Complete & compute verdict'}
                </Button>
              )}
              {data.status === 'Active' && !showStopPrompt && (
                <Button variant="ghost" onClick={() => setShowStopPrompt(true)}>
                  Stop early
                </Button>
              )}
              {data.result && (
                <Link to={`/app/experiments/${id}/result`} className={buttonClass('primary')}>
                  View result
                </Link>
              )}
            </div>

            {showStopPrompt && data.status === 'Active' && (
              <div className="animate-fade mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-xl text-amber-950">Stop this experiment?</h2>
                <p className="mt-1 text-sm text-amber-950/80">
                  Optional: note why you are stopping. Afterward you can still finalize with Complete to
                  compute a verdict from logged check-ins.
                </p>
                <label className="mt-4 block">
                  <span className="field-label text-amber-950/80">Reason (optional)</span>
                  <input
                    type="text"
                    value={stopReason}
                    onChange={(e) => setStopReason(e.target.value)}
                    className="field"
                    placeholder="e.g. schedule conflict, safety concern"
                  />
                </label>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Button variant="warning" onClick={confirmStop} disabled={stop.isPending}>
                    {stop.isPending ? 'Stopping…' : 'Confirm stop'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowStopPrompt(false)
                      setStopReason('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>

          {error && !canLog && <Alert className="mb-6">{error}</Alert>}

          <div className={canLog ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]' : ''}>
            <div className="min-w-0 space-y-6">
              <PhaseProgress
                className="animate-rise-delay"
                startDate={data.startDate}
                phaseAEnd={data.phaseAEnd}
                endDate={data.endDate}
                phaseALabel={phaseALabel}
                phaseBLabel={phaseBLabel}
              />

              <MetricPhaseChart
                className="animate-rise-delay"
                checkIns={checkIns.data ?? []}
                isLoading={checkIns.isPending}
                metricLabel={metricLabel}
                phaseALabel={phaseALabel}
                phaseBLabel={phaseBLabel}
                meanA={preview.data?.meanA}
                meanB={preview.data?.meanB}
              />

              {(status === 'Active' || status === 'Stopped') && (
                <section className="animate-rise-late">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl text-[var(--color-ink)]">Mid-run preview</h2>
                      <p className="text-sm text-[var(--color-muted)]">Live stats while the protocol is still open.</p>
                    </div>
                    {preview.data && <VerdictBadge verdict={preview.data.verdict} provisional />}
                  </div>

                  {checkIns.isPending && <Skeleton className="h-40" />}

                  {checkIns.isSuccess && !hasCheckIns && (
                    <Alert tone="info">Log a few check-ins to unlock the provisional analysis.</Alert>
                  )}

                  {previewEnabled && preview.isPending && <Skeleton className="h-40" />}

                  {previewMissingPhases && (
                    <Alert tone="warning">
                      Need check-ins from both phases before a preview can run. Keep logging through{' '}
                      {phaseALabel} and {phaseBLabel}.
                    </Alert>
                  )}

                  {preview.isError && !previewMissingPhases && (
                    <Alert>
                      {preview.error instanceof ApiError
                        ? preview.error.message
                        : 'Could not load preview analysis.'}
                    </Alert>
                  )}

                  {preview.data && (
                    <>
                      <StatGrid
                        stats={preview.data}
                        provisional
                        phaseALabel={phaseALabel}
                        phaseBLabel={phaseBLabel}
                      />
                      <ConfidencePanel className="mt-4" evidenceJson={preview.data.evidenceJson} provisional />
                    </>
                  )}
                </section>
              )}

              <section className="card animate-rise-late overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
                  <h2 className="text-2xl text-[var(--color-ink)]">Check-in log</h2>
                  {hasCheckIns && (
                    <span className="text-xs text-[var(--color-subtle)]">{recentCheckIns.length} entries</span>
                  )}
                </div>
                {checkIns.data?.length === 0 && (
                  <p className="px-5 pb-6 text-sm text-[var(--color-muted)] sm:px-6">
                    No check-ins yet — your first one takes 30 seconds.
                  </p>
                )}
                {hasCheckIns && (
                  <ul className="max-h-[28rem] divide-y divide-[var(--color-line)] overflow-y-auto border-t border-[var(--color-line)]">
                    {recentCheckIns.map((checkIn) => (
                      <li key={checkIn.id} className="flex items-center gap-3 px-5 py-3 text-sm sm:px-6">
                        <PhaseBadge phase={checkIn.phase} />
                        <span className="w-16 shrink-0 font-semibold text-[var(--color-ink)]">
                          {formatDay(checkIn.day)}
                        </span>
                        <span className="w-10 shrink-0 font-display text-lg tabular-nums text-[var(--color-ink)]">
                          {checkIn.metricValue}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[var(--color-muted)]" title={checkIn.notes ?? ''}>
                          {checkIn.notes}
                        </span>
                        {checkIn.safetyFlag && (
                          <span className="shrink-0 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                            safety
                          </span>
                        )}
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${checkIn.adhered ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {checkIn.adhered ? 'adhered' : 'missed'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {canLog && (
              <aside className="animate-rise-late space-y-6 lg:sticky lg:top-24">
                {todayCheckIn && (
                  <div className="card p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
                          <path d="m5 10.5 3.2 3L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div>
                        <p className="eyebrow">Today</p>
                        <h2 className="text-2xl text-[var(--color-ink)]">Logged — nice work</h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-[var(--color-muted)]">
                      {metricLabel}:{' '}
                      <strong className="font-display text-xl text-[var(--color-ink)]">{todayCheckIn.metricValue}</strong>
                      {' · '}
                      {todayCheckIn.adhered ? 'protocol followed' : 'protocol missed'}
                    </p>
                    {streak > 1 && (
                      <p className="mt-3 rounded-xl bg-[var(--color-phase-b-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-phase-b)]">
                        {streak}-day streak — come back tomorrow to keep it going.
                      </p>
                    )}
                  </div>
                )}

                {!todayCheckIn && (
                <form onSubmit={onSubmit} className="card p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">Today</p>
                      <h2 className="mt-1 text-2xl text-[var(--color-ink)]">30-second check-in</h2>
                    </div>
                    {streak > 0 && (
                      <span
                        className="rounded-lg bg-[var(--color-phase-b-soft)] px-2.5 py-1 text-xs font-bold text-[var(--color-phase-b)]"
                        title="Consecutive days logged"
                      >
                        {streak}-day streak
                      </span>
                    )}
                  </div>

                  <label className="mt-5 block">
                    <span className="flex items-end justify-between gap-3">
                      <span className="field-label mb-0">{metricLabel}</span>
                      <span className="font-display text-4xl leading-none tabular-nums text-[var(--color-accent)]">
                        {metricValue}
                        <span className="font-body text-sm text-[var(--color-subtle)]"> /10</span>
                      </span>
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={0.5}
                      value={metricValue}
                      onChange={(e) => setMetricValue(Number(e.target.value))}
                      className="range mt-4"
                      style={{ '--range-fill': `${((metricValue - 1) / 9) * 100}%` } as CSSProperties}
                    />
                    <span className="mt-1.5 flex justify-between text-xs text-[var(--color-subtle)]">
                      <span>1 · low</span>
                      <span>10 · high</span>
                    </span>
                  </label>

                  <div className="mt-5 space-y-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-surface-muted)] has-[:checked]:bg-emerald-50 has-[:checked]:ring-emerald-700/20">
                      <input
                        type="checkbox"
                        className="check"
                        checked={adhered}
                        onChange={(e) => setAdhered(e.target.checked)}
                      />
                      <span className="text-sm font-semibold text-[var(--color-ink)]">Followed the protocol today</span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 ring-1 ring-[var(--color-line)] transition hover:bg-amber-50/60 has-[:checked]:bg-amber-50 has-[:checked]:ring-amber-600/30">
                      <input
                        type="checkbox"
                        className="check mt-0.5"
                        checked={safetyFlag}
                        onChange={(e) => setSafetyFlag(e.target.checked)}
                      />
                      <span className="text-sm text-amber-950">
                        <strong className="font-semibold">Safety concern</strong> — stop and seek professional
                        care if needed
                      </span>
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="field-label">Note (optional)</span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="field resize-none"
                      rows={2}
                      placeholder="Anything unusual today?"
                    />
                  </label>

                  {error && <Alert className="mt-4">{error}</Alert>}

                  <Button
                    type="submit"
                    disabled={addCheckIn.isPending || data.status !== 'Active'}
                    className="mt-5 w-full py-3"
                  >
                    {addCheckIn.isPending ? 'Saving…' : 'Save check-in'}
                  </Button>
                  {data.status === 'Draft' && (
                    <p className="mt-2 text-center text-xs text-[var(--color-subtle)]">
                      Start the protocol to log check-ins.
                    </p>
                  )}
                </form>
                )}

                <div className="card-muted p-5">
                  <h2 className="text-lg text-[var(--color-ink)]">Import CSV</h2>
                  <p className="mt-1 mb-4 text-sm leading-relaxed text-[var(--color-muted)]">
                    Load the earlier-bedtime sample, or upload your own phase A/B file.
                  </p>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Button
                      variant="secondary"
                      disabled={importCsv.isPending}
                      onClick={() => void loadSampleData()}
                    >
                      {importCsv.isPending ? 'Loading…' : 'Load sample data'}
                    </Button>
                    <a
                      href={SAMPLE_CSV_PATH}
                      download="earlier-bedtime-demo.csv"
                      className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      Download sample
                    </a>
                  </div>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    aria-label="Upload CSV"
                    className="file-input w-full text-sm text-[var(--color-muted)]"
                    disabled={importCsv.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        importCsv.mutate(file)
                      }
                    }}
                  />
                </div>
              </aside>
            )}
          </div>

          <Disclaimer className="mt-10" />
        </>
      )}
    </AppShell>
  )
}
