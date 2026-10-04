import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  completeExperiment,
  createCheckIn,
  fetchCheckIns,
  fetchExperiment,
  importCheckIns,
  startExperiment,
  stopExperiment,
} from '../api/experiments'
import { ApiError } from '../api/client'
import { AppShell } from '../components/AppShell'
import { Disclaimer } from '../components/Disclaimer'

export function ActiveExperimentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [metricValue, setMetricValue] = useState(7)
  const [adhered, setAdhered] = useState(true)
  const [notes, setNotes] = useState('')
  const [safetyFlag, setSafetyFlag] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['experiment', id] }),
      queryClient.invalidateQueries({ queryKey: ['check-ins', id] }),
      queryClient.invalidateQueries({ queryKey: ['experiments'] }),
    ])
  }

  const start = useMutation({
    mutationFn: () => startExperiment(id),
    onSuccess: refresh,
  })

  const stop = useMutation({
    mutationFn: () => stopExperiment(id),
    onSuccess: refresh,
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
  const todayPhase =
    data?.startDate && data.phaseAEnd
      ? new Date().toISOString().slice(0, 10) <= data.phaseAEnd
        ? 'A'
        : 'B'
      : null

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    addCheckIn.mutate()
  }

  return (
    <AppShell>
      {experiment.isPending && <p className="text-[var(--color-muted)]">Loading experiment…</p>}
      {experiment.isError && <p className="text-red-700">Experiment not found.</p>}

      {data && (
        <>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-wider text-[var(--color-muted)]">
              {data.status}
              {todayPhase ? ` · Phase ${todayPhase}` : ''}
            </p>
            <h1 className="mt-1 text-4xl text-[var(--color-ink)]">
              {data.templateTitle ?? data.templateKey}
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--color-muted)]">{data.hypothesis}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {data.startDate ?? '—'} → {data.endDate ?? '—'} · {data.checkInCount} check-ins
            </p>
            {data.stopReason && (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {data.stopReason}
              </p>
            )}
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {data.status === 'Draft' && (
              <button
                type="button"
                onClick={() => start.mutate()}
                className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Start
              </button>
            )}
            {data.status === 'Active' && (
              <>
                <button
                  type="button"
                  onClick={() => complete.mutate()}
                  className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Complete & compute verdict
                </button>
                <button
                  type="button"
                  onClick={() => stop.mutate()}
                  className="rounded-md bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-semibold"
                >
                  Stop
                </button>
              </>
            )}
            {data.result && (
              <Link
                to={`/app/experiments/${id}/result`}
                className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                View result
              </Link>
            )}
          </div>

          {(data.status === 'Active' || data.status === 'Draft') && (
            <section className="mb-10 grid gap-8 md:grid-cols-2">
              <form
                onSubmit={onSubmit}
                className="rounded-lg border border-emerald-900/10 bg-white/70 p-5"
              >
                <h2 className="mb-4 text-2xl">30s check-in</h2>
                <label className="mb-4 block text-sm">
                  <span className="mb-1 block text-[var(--color-muted)]">Metric (1–10)</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={metricValue}
                    onChange={(e) => setMetricValue(Number(e.target.value))}
                    className="w-full rounded-md border border-emerald-900/15 px-3 py-2"
                    required
                  />
                </label>
                <label className="mb-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={adhered}
                    onChange={(e) => setAdhered(e.target.checked)}
                  />
                  Followed the protocol today
                </label>
                <label className="mb-3 flex items-center gap-2 text-sm text-amber-900">
                  <input
                    type="checkbox"
                    checked={safetyFlag}
                    onChange={(e) => setSafetyFlag(e.target.checked)}
                  />
                  Safety concern / stop experiment
                </label>
                <label className="mb-4 block text-sm">
                  <span className="mb-1 block text-[var(--color-muted)]">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-emerald-900/15 px-3 py-2"
                    rows={3}
                  />
                </label>
                {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
                <button
                  type="submit"
                  disabled={addCheckIn.isPending || data.status !== 'Active'}
                  className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Save check-in
                </button>
              </form>

              <div className="rounded-lg border border-emerald-900/10 bg-white/70 p-5">
                <h2 className="mb-4 text-2xl">Import CSV</h2>
                <p className="mb-4 text-sm text-[var(--color-muted)]">
                  Columns: day,phase,metric,adhered,notes,safety. Sample in{' '}
                  <code>data/samples/</code>.
                </p>
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

          <section>
            <h2 className="mb-3 text-2xl">Check-ins</h2>
            <ul className="space-y-2">
              {checkIns.data?.map((checkIn) => (
                <li
                  key={checkIn.id}
                  className="rounded-md border border-emerald-900/10 bg-white/60 px-3 py-2 text-sm"
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
