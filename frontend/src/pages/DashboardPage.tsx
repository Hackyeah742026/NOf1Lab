import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchShowcase } from '../api/demo'
import { fetchExperiments } from '../api/experiments'
import type { Experiment, ExperimentStatus } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button, buttonClass } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../lib/demoAccount'

const groups: { status: ExperimentStatus; title: string; hint: string }[] = [
  { status: 'Active', title: 'Active', hint: 'In progress — keep logging check-ins.' },
  { status: 'Completed', title: 'Completed', hint: 'Final verdicts ready to review.' },
  { status: 'Stopped', title: 'Stopped', hint: 'Ended early — check-ins still available.' },
]

function ExperimentRow({ experiment }: { experiment: Experiment }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-900/10 bg-white/70 px-4 py-3">
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
        {(experiment.status === 'Active' ||
          experiment.status === 'Draft' ||
          experiment.status === 'Stopped') && (
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
  )
}

export function DashboardPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [demoBusy, setDemoBusy] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  const experiments = useQuery({
    queryKey: ['experiments'],
    queryFn: fetchExperiments,
  })

  const list = experiments.data ?? []
  const active = list.filter((item) => item.status === 'Active')
  const drafts = list.filter((item) => item.status === 'Draft')
  const firstActive = active[0]
  const hasAny = list.length > 0

  async function openDemoResult() {
    setDemoBusy(true)
    setDemoError(null)
    try {
      // Hop to demo when needed so showcase is available even if another user is signed in.
      if (user?.email !== DEMO_EMAIL) {
        await login(DEMO_EMAIL, DEMO_PASSWORD)
      }
      const showcase = await fetchShowcase()
      navigate(`/app/experiments/${showcase.experimentId}/result`, {
        state: { fromShowcase: true },
      })
    } catch (err) {
      setDemoError(err instanceof ApiError ? err.message : 'Could not open demo result.')
    } finally {
      setDemoBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl text-[var(--color-ink)]">Dashboard</h1>
          <p className="mt-2 text-[var(--color-muted)]">
            Active experiments, history, and the seeded demo result.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled={demoBusy} onClick={() => void openDemoResult()}>
            {demoBusy ? 'Opening…' : 'Open demo result'}
          </Button>
          {firstActive && (
            <Link to={`/app/experiments/${firstActive.id}`} className={buttonClass('primary')}>
              Continue
            </Link>
          )}
          <Link
            to="/app/templates"
            className={buttonClass(firstActive ? 'secondary' : 'primary')}
          >
            New experiment
          </Link>
        </div>
      </div>

      {demoError && <p className="mb-4 text-sm text-red-700">{demoError}</p>}

      {experiments.isPending && <p className="text-[var(--color-muted)]">Loading experiments…</p>}
      {experiments.isError && <p className="text-red-700">Could not load experiments.</p>}

      {!experiments.isPending && !experiments.isError && !hasAny && (
        <EmptyState
          title="No experiments yet"
          message="Pick a template to start your first A/B self-experiment. The demo account also has a seeded result ready to open."
          action={
            <Link to="/app/templates" className={buttonClass('primary')}>
              Browse templates
            </Link>
          }
        />
      )}

      {!experiments.isPending && hasAny && (
        <div className="space-y-8">
          {groups.map((group) => {
            const items = list.filter((item) => item.status === group.status)
            if (items.length === 0) return null
            return (
              <section key={group.status} className="animate-rise">
                <div className="mb-3">
                  <h2 className="text-2xl text-[var(--color-ink)]">{group.title}</h2>
                  <p className="text-sm text-[var(--color-muted)]">{group.hint}</p>
                </div>
                <ul className="space-y-3">
                  {items.map((experiment) => (
                    <ExperimentRow key={experiment.id} experiment={experiment} />
                  ))}
                </ul>
              </section>
            )
          })}

          {drafts.length > 0 && (
            <section className="animate-rise-delay">
              <div className="mb-3">
                <h2 className="text-2xl text-[var(--color-ink)]">Draft</h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Created but not started yet.
                </p>
              </div>
              <ul className="space-y-3">
                {drafts.map((experiment) => (
                  <ExperimentRow key={experiment.id} experiment={experiment} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}
