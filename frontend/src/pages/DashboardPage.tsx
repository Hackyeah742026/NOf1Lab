import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchExperiments } from '../api/experiments'
import { AppShell } from '../components/AppShell'

export function DashboardPage() {
  const experiments = useQuery({
    queryKey: ['experiments'],
    queryFn: fetchExperiments,
  })

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl text-[var(--color-ink)]">Dashboard</h1>
          <p className="mt-2 text-[var(--color-muted)]">
            Active experiments, history, and the seeded demo result.
          </p>
        </div>
        <Link
          to="/app/templates"
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          New experiment
        </Link>
      </div>

      {experiments.isPending && <p className="text-[var(--color-muted)]">Loading experiments…</p>}
      {experiments.isError && (
        <p className="text-red-700">Could not load experiments.</p>
      )}

      <ul className="space-y-3">
        {experiments.data?.map((experiment) => (
          <li
            key={experiment.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-900/10 bg-white/70 px-4 py-3"
          >
            <div>
              <p className="font-semibold text-[var(--color-ink)]">
                {experiment.templateTitle ?? experiment.templateKey}
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                {experiment.status}
                {experiment.result ? ` · ${experiment.result.verdict}` : ''}
                {` · ${experiment.checkInCount} check-ins`}
              </p>
            </div>
            <div className="flex gap-2">
              {(experiment.status === 'Active' || experiment.status === 'Draft') && (
                <Link
                  to={`/app/experiments/${experiment.id}`}
                  className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
                >
                  Open
                </Link>
              )}
              {(experiment.status === 'Completed' || experiment.result) && (
                <Link
                  to={`/app/experiments/${experiment.id}/result`}
                  className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
                >
                  Result
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  )
}
