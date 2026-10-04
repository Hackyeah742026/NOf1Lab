import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchShowcase } from '../api/demo'
import { fetchCheckIns, fetchExperiments } from '../api/experiments'
import type { Experiment, ExperimentStatus } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { StatusBadge, VerdictBadge } from '../components/Badge'
import { Button, buttonClass } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Alert, PageHeader, Skeleton } from '../components/Feedback'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../lib/demoAccount'
import { currentStreak, findTodayCheckIn } from '../lib/streak'
import { formatDay } from '../lib/verdict'

const groups: { status: ExperimentStatus; title: string; hint: string }[] = [
  { status: 'Active', title: 'Active', hint: 'In progress — keep logging check-ins.' },
  { status: 'Draft', title: 'Draft', hint: 'Created but not started yet.' },
  { status: 'Completed', title: 'Completed', hint: 'Final verdicts ready to review.' },
  { status: 'Stopped', title: 'Stopped', hint: 'Ended early — check-ins still available.' },
]

function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const hasResult = experiment.status === 'Completed' || Boolean(experiment.result)
  const href = hasResult ? `/app/experiments/${experiment.id}/result` : `/app/experiments/${experiment.id}`
  const dates =
    experiment.startDate && experiment.endDate
      ? `${formatDay(experiment.startDate)} – ${formatDay(experiment.endDate)}`
      : 'Not started'

  return (
    <li>
      <Link
        to={href}
        className="card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={experiment.status} />
          {experiment.result && <VerdictBadge verdict={experiment.result.verdict} />}
        </div>
        <h3 className="mt-3 text-xl leading-snug text-[var(--color-ink)]">
          {experiment.templateTitle ?? experiment.templateKey}
        </h3>
        {experiment.hypothesis && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {experiment.hypothesis}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-3.5 text-xs text-[var(--color-subtle)]">
          <span>
            {dates} · {experiment.checkInCount} check-in{experiment.checkInCount === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-accent)]">
            {hasResult ? 'Result' : 'Open'}
            <svg
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
              fill="none"
              aria-hidden
            >
              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </Link>
    </li>
  )
}

function SummaryTile({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="card px-5 py-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums text-[var(--color-ink)]">{value}</p>
      <p className="text-xs text-[var(--color-subtle)]">{hint}</p>
    </div>
  )
}

type TodayStatus = { experiment: Experiment; logged: boolean; streak: number }

function TodayPanel({ items }: { items: TodayStatus[] }) {
  const pending = items.filter((item) => !item.logged)
  const bestStreak = Math.max(0, ...items.map((item) => item.streak))

  if (pending.length === 0) {
    return (
      <div className="animate-rise flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-800/10 bg-emerald-50 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
            <path d="m5 10.5 3.2 3L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="flex-1 text-sm text-emerald-950">
          <strong>All caught up for today.</strong> Every active experiment has today's check-in.
        </p>
        {bestStreak > 1 && (
          <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[var(--color-phase-b)] ring-1 ring-[var(--color-line)]">
            {bestStreak}-day streak
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="animate-rise overflow-hidden rounded-2xl border border-amber-800/15 bg-gradient-to-r from-[var(--color-phase-b-soft)] to-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div>
          <p className="eyebrow text-[var(--color-phase-b)]">Today</p>
          <p className="font-display text-xl text-[var(--color-ink)]">
            {pending.length === 1 ? '1 check-in waiting' : `${pending.length} check-ins waiting`}
          </p>
        </div>
        {bestStreak > 0 && (
          <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[var(--color-phase-b)] ring-1 ring-[var(--color-line)]">
            {bestStreak}-day streak · don't break it
          </span>
        )}
      </div>
      <ul className="mt-3 divide-y divide-amber-900/10 border-t border-amber-900/10">
        {pending.map(({ experiment }) => (
          <li key={experiment.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-ink)]">
              {experiment.templateTitle ?? experiment.templateKey}
            </span>
            <Link to={`/app/experiments/${experiment.id}`} className={buttonClass('primary', 'shrink-0 px-4 py-2')}>
              Log now · 30s
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
  const completed = list.filter((item) => item.status === 'Completed')
  const kept = list.filter((item) => item.result?.verdict === 'Keep').length
  const totalCheckIns = list.reduce((sum, item) => sum + item.checkInCount, 0)
  const firstActive = active[0]

  const activeCheckIns = useQueries({
    queries: active.map((experiment) => ({
      queryKey: ['check-ins', experiment.id],
      queryFn: () => fetchCheckIns(experiment.id),
    })),
  })
  const todayReady = active.length > 0 && activeCheckIns.every((query) => query.isSuccess)
  const todayStatus: TodayStatus[] = active.map((experiment, index) => {
    const checkIns = activeCheckIns[index]?.data
    return {
      experiment,
      logged: Boolean(findTodayCheckIn(checkIns)),
      streak: currentStreak(checkIns),
    }
  })
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
      <PageHeader
        eyebrow="Your lab"
        title="Dashboard"
        description="Active experiments, history, and the seeded demo result."
        actions={
          <>
            <Button variant="ghost" disabled={demoBusy} onClick={() => void openDemoResult()}>
              {demoBusy ? 'Opening…' : 'Open demo result'}
            </Button>
            {firstActive && (
              <Link to={`/app/experiments/${firstActive.id}`} className={buttonClass('secondary')}>
                Continue logging
              </Link>
            )}
            <Link to="/app/templates" className={buttonClass('primary')}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New experiment
            </Link>
          </>
        }
      />

      {demoError && <Alert className="mb-6">{demoError}</Alert>}

      {experiments.isPending && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-44" />
            ))}
          </div>
        </div>
      )}
      {experiments.isError && <Alert>Could not load experiments. Is the API running?</Alert>}

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
        <div className="space-y-10">
          {todayReady && <TodayPanel items={todayStatus} />}

          <div className="animate-rise grid gap-4 sm:grid-cols-3">
            <SummaryTile label="Active" value={active.length} hint="experiments running now" />
            <SummaryTile
              label="Completed"
              value={completed.length}
              hint={`${kept} habit${kept === 1 ? '' : 's'} worth keeping`}
            />
            <SummaryTile label="Check-ins" value={totalCheckIns} hint="data points logged" />
          </div>

          {groups.map((group) => {
            const items = list.filter((item) => item.status === group.status)
            if (items.length === 0) return null
            return (
              <section key={group.status} className="animate-rise-delay">
                <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-2xl text-[var(--color-ink)]">{group.title}</h2>
                  <span className="rounded-full bg-emerald-900/[0.06] px-2 py-0.5 text-xs font-bold text-[var(--color-muted)]">
                    {items.length}
                  </span>
                  <p className="text-sm text-[var(--color-subtle)]">{group.hint}</p>
                </div>
                <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((experiment) => (
                    <ExperimentCard key={experiment.id} experiment={experiment} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
