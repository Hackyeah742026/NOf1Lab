import { useState, type FormEvent } from 'react'
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
import { Button, buttonClass } from '../components/Button'
import { Disclaimer } from '../components/Disclaimer'
import { MetricPhaseChart } from '../components/MetricPhaseChart'
import { PhaseProgress } from '../components/PhaseProgress'
import { StatGrid } from '../components/StatGrid'

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
      {experiment.isPending && <p className="text-[var(--color-muted)]">Loading experiment…</p>}
      {experiment.isError && <p className="text-red-700">Experiment not found.</p>}

      {data && (
        <>
          <section className="animate-rise mb-8 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[var(--color-panel)] p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {data.status}
                  {template ? ` · ${metricLabel}` : ''}
                </p>
                <h1 className="mt-2 text-4xl text-[var(--color-ink)] md:text-5xl">
                  {data.templateTitle ?? data.templateKey}
                </h1>
                <p className="mt-3 max-w-2xl text-lg text-[var(--color-muted)]">{data.hypothesis}</p>
                {template && (
                  <p className="mt-3 text-sm text-[var(--color-muted)]">
                    Tracking <span className="font-semibold text-[var(--color-ink)]">{metricLabel}</span>
                    {' · '}
                    {phaseALabel} → {phaseBLabel}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-[var(--color-accent-soft)] px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Check-ins</p>
                <p className="text-3xl font-semibold text-[var(--color-accent)]">{data.checkInCount}</p>
              </div>
            </div>
            {data.stopReason && (
              <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                Stopped: {data.stopReason}
              </p>
            )}
            {data.status === 'Stopped' && !data.result && (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Protocol paused. Finalize with Complete to compute a verdict from the check-ins you
                already logged.
              </p>
            )}
          </section>

          <div className="mb-6 flex flex-wrap gap-3">
            {data.status === 'Draft' && (
              <Button onClick={() => start.mutate()} disabled={start.isPending}>
                {start.isPending ? 'Starting…' : 'Start'}
              </Button>
            )}
            {data.status === 'Active' && (
              <>
                <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
                  {complete.isPending ? 'Completing…' : 'Complete & compute verdict'}
                </Button>
                <Button variant="secondary" onClick={() => setShowStopPrompt(true)}>
                  Stop
                </Button>
              </>
            )}
            {data.status === 'Stopped' && !data.result && (
              <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
                {complete.isPending ? 'Completing…' : 'Complete & compute verdict'}
              </Button>
            )}
            {data.result && (
              <Link to={`/app/experiments/${id}/result`} className={buttonClass('primary')}>
                View result
              </Link>
            )}
          </div>

          {showStopPrompt && data.status === 'Active' && (
            <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <h2 className="text-xl text-amber-950">Stop this experiment?</h2>
              <p className="mt-1 text-sm text-amber-950/80">
                Optional: note why you are stopping. Afterward you can still finalize with Complete
                to compute a verdict from logged check-ins.
              </p>
              <label className="mt-4 block text-sm text-amber-950">
                <span className="mb-1 block">Reason (optional)</span>
                <input
                  type="text"
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  className="w-full rounded-md border border-amber-300 bg-white px-3 py-2"
                  placeholder="e.g. schedule conflict, safety concern"
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={confirmStop}
                  disabled={stop.isPending}
                  className="bg-amber-800 hover:bg-amber-900"
                >
                  {stop.isPending ? 'Stopping…' : 'Confirm stop'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowStopPrompt(false)
                    setStopReason('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </section>
          )}

          {error && data.status !== 'Active' && data.status !== 'Draft' && (
            <p className="mb-6 text-sm text-red-700">{error}</p>
          )}

          <PhaseProgress
            className="animate-rise-delay mb-6"
            startDate={data.startDate}
            phaseAEnd={data.phaseAEnd}
            endDate={data.endDate}
            phaseALabel={phaseALabel}
            phaseBLabel={phaseBLabel}
          />

          <MetricPhaseChart
            className="animate-rise-delay mb-8"
            checkIns={checkIns.data ?? []}
            isLoading={checkIns.isPending}
            metricLabel={metricLabel}
            phaseALabel={phaseALabel}
            phaseBLabel={phaseBLabel}
            meanA={preview.data?.meanA}
            meanB={preview.data?.meanB}
          />

          {(status === 'Active' || status === 'Stopped') && (
            <section className="animate-rise-late mb-8">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl">Mid-run preview</h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Live stats while the protocol is still open.
                  </p>
                </div>
              </div>

              {checkIns.isPending && (
                <p className="text-sm text-[var(--color-muted)]">Loading check-ins…</p>
              )}

              {checkIns.isSuccess && !hasCheckIns && (
                <p className="rounded-xl border border-emerald-900/10 bg-white/65 px-4 py-3 text-sm text-[var(--color-muted)]">
                  Log a few check-ins to unlock the provisional analysis.
                </p>
              )}

              {previewEnabled && preview.isPending && (
                <p className="text-sm text-[var(--color-muted)]">Computing preview…</p>
              )}

              {previewMissingPhases && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  Need check-ins from both phases before a preview can run. Keep logging through{' '}
                  {phaseALabel} and {phaseBLabel}.
                </p>
              )}

              {preview.isError && !previewMissingPhases && (
                <p className="text-sm text-red-700">
                  {preview.error instanceof ApiError
                    ? preview.error.message
                    : 'Could not load preview analysis.'}
                </p>
              )}

              {preview.data && (
                <>
                  <p className="mb-3 text-sm text-[var(--color-muted)]">
                    Provisional verdict signal:{' '}
                    <span className="font-semibold text-[var(--color-ink)]">
                      {preview.data.verdict}
                    </span>
                  </p>
                  <StatGrid stats={preview.data} provisional />
                </>
              )}
            </section>
          )}

          {(data.status === 'Active' || data.status === 'Draft') && (
            <section className="animate-rise-late mb-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-emerald-900/10 bg-white/80 p-6 shadow-sm"
              >
                <h2 className="mb-1 text-3xl">30-second check-in</h2>
                <p className="mb-5 text-sm text-[var(--color-muted)]">
                  {metricLabel}. One adherence checkbox. Done.
                </p>
                <label className="mb-5 block text-sm">
                  <span className="mb-2 block text-[var(--color-muted)]">
                    {metricLabel} (1–10)
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={metricValue}
                    onChange={(e) => setMetricValue(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent)]"
                  />
                  <span className="mt-2 inline-block text-3xl font-semibold text-[var(--color-accent)]">
                    {metricValue}
                  </span>
                </label>
                <label className="mb-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={adhered}
                    onChange={(e) => setAdhered(e.target.checked)}
                  />
                  Followed the protocol today
                </label>
                <label className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  <input
                    type="checkbox"
                    checked={safetyFlag}
                    onChange={(e) => setSafetyFlag(e.target.checked)}
                  />
                  Safety concern — stop and seek professional care if needed
                </label>
                <label className="mb-4 block text-sm">
                  <span className="mb-1 block text-[var(--color-muted)]">Optional note</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-emerald-900/15 px-3 py-2"
                    rows={2}
                  />
                </label>
                {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
                <Button
                  type="submit"
                  disabled={addCheckIn.isPending || data.status !== 'Active'}
                  className="px-5 py-3"
                >
                  Save check-in
                </Button>
              </form>

              <div className="rounded-2xl border border-emerald-900/10 bg-white/70 p-6">
                <h2 className="mb-2 text-2xl">Import CSV</h2>
                <p className="mb-4 text-sm leading-relaxed text-[var(--color-muted)]">
                  Fast path for demos: load the earlier-bedtime sample, or upload your own phase A/B
                  CSV.
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Button
                    disabled={importCsv.isPending || data.status !== 'Active'}
                    onClick={() => void loadSampleData()}
                  >
                    {importCsv.isPending ? 'Loading…' : 'Load sample data'}
                  </Button>
                  <a
                    href={SAMPLE_CSV_PATH}
                    download="earlier-bedtime-demo.csv"
                    className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    Download sample CSV
                  </a>
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      importCsv.mutate(file)
                    }
                  }}
                />
              </div>
            </section>
          )}

          <section className="animate-rise-late">
            <h2 className="mb-3 text-2xl">Recent check-ins</h2>
            <ul className="space-y-2">
              {checkIns.data?.map((checkIn) => (
                <li
                  key={checkIn.id}
                  className="rounded-xl border border-emerald-900/10 bg-white/65 px-4 py-3 text-sm"
                >
                  <span className="font-semibold">{checkIn.day}</span> · Phase {checkIn.phase} ·{' '}
                  {checkIn.metricValue}
                  {checkIn.adhered ? ' · adhered' : ' · missed'}
                  {checkIn.notes ? ` · ${checkIn.notes}` : ''}
                </li>
              ))}
              {checkIns.data?.length === 0 && (
                <li className="text-sm text-[var(--color-muted)]">No check-ins yet.</li>
              )}
            </ul>
          </section>

          <Disclaimer className="mt-10" />
        </>
      )}
    </AppShell>
  )
}
