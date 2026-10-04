import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchShowcase } from '../api/demo'
import type { CheckIn } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { VerdictBadge } from '../components/Badge'
import { Button, buttonClass } from '../components/Button'
import { Disclaimer } from '../components/Disclaimer'
import { Alert } from '../components/Feedback'
import { Logo } from '../components/Logo'
import { MetricPhaseChart } from '../components/MetricPhaseChart'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../lib/demoAccount'

const steps = [
  {
    title: 'Pick a question',
    detail: 'Choose a template — earlier bedtime, morning light, training load — and state your hypothesis.',
  },
  {
    title: 'Log for 30 seconds a day',
    detail: 'One metric, one adherence tick. Baseline phase A first, then the change in phase B.',
  },
  {
    title: 'Get a computed verdict',
    detail: 'The stats engine compares the phases and calls Keep, Drop, Modify, or Inconclusive.',
  },
] as const

const features = [
  {
    label: 'Sport',
    detail: 'Training load, recovery, and consistency you can actually compare.',
  },
  {
    label: 'Body',
    detail: 'Physical signals framed as short A/B runs, not endless dashboards.',
  },
  {
    label: 'Mind',
    detail: 'Focus and mood experiments with a clear Keep / Drop / Modify call.',
  },
  {
    label: 'Decisions',
    detail: 'Lifestyle choices backed by your own data — not generic advice.',
  },
] as const

const previewCheckIns: CheckIn[] = [
  { id: 'p1', day: '2026-09-01', phase: 'A', metricValue: 5, adhered: true, safetyFlag: false },
  { id: 'p2', day: '2026-09-02', phase: 'A', metricValue: 5.5, adhered: true, safetyFlag: false },
  { id: 'p3', day: '2026-09-03', phase: 'A', metricValue: 4.5, adhered: true, safetyFlag: false },
  { id: 'p4', day: '2026-09-04', phase: 'A', metricValue: 5, adhered: true, safetyFlag: false },
  { id: 'p5', day: '2026-09-05', phase: 'A', metricValue: 6, adhered: true, safetyFlag: false },
  { id: 'p6', day: '2026-09-06', phase: 'B', metricValue: 7, adhered: true, safetyFlag: false },
  { id: 'p7', day: '2026-09-07', phase: 'B', metricValue: 7.5, adhered: true, safetyFlag: false },
  { id: 'p8', day: '2026-09-08', phase: 'B', metricValue: 6.5, adhered: true, safetyFlag: false },
  { id: 'p9', day: '2026-09-09', phase: 'B', metricValue: 8, adhered: true, safetyFlag: false },
  { id: 'p10', day: '2026-09-10', phase: 'B', metricValue: 7, adhered: true, safetyFlag: false },
]

export function LandingPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [demoBusy, setDemoBusy] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

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
    <div className="relative min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Link to={user ? '/app' : '/login'} className={buttonClass('secondary', 'py-2')}>
          {user ? 'Open dashboard' : 'Sign in'}
        </Link>
      </header>

      <main>
        <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <p className="animate-rise mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-[var(--color-accent)] shadow-sm ring-1 ring-[var(--color-line)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            Personal experiment OS
          </p>
          <h1 className="animate-rise-delay max-w-4xl text-5xl leading-[1.02] text-[var(--color-ink)] sm:text-6xl md:text-[5.25rem]">
            Stop guessing what works.{' '}
            <span className="italic text-[var(--color-accent)]">Test it on yourself.</span>
          </h1>
          <p className="animate-rise-late mt-7 max-w-xl text-lg leading-relaxed text-[var(--color-muted)] md:text-xl">
            Scattered health data rarely becomes a decision. Run a short A/B experiment on yourself,
            log a few signals, and get a computed Keep / Drop / Modify verdict.
          </p>

          <div className="animate-rise-late mt-10 flex flex-wrap items-center gap-3">
            <Link to={user ? '/app' : '/login'} className={buttonClass('primary', 'px-7 py-3.5 text-base')}>
              {user ? 'Open dashboard' : 'Start an experiment'}
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path
                  d="M4 10h12m-4-4 4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Button
              variant="secondary"
              className="px-7 py-3.5 text-base"
              disabled={demoBusy}
              onClick={() => void openDemoResult()}
            >
              {demoBusy ? 'Opening…' : 'See a demo result'}
            </Button>
          </div>

          {demoError && (
            <Alert className="mt-5 max-w-xl">{demoError}</Alert>
          )}

          <Disclaimer className="animate-rise-late mt-8 max-w-xl" />
        </section>

        <section className="relative border-t border-[var(--color-line)] bg-white/50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="eyebrow mb-3">How it works</p>
            <ol className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="card p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] font-display text-lg text-[var(--color-accent)]">
                    {index + 1}
                  </span>
                  <h2 className="mt-4 text-xl text-[var(--color-ink)]">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{step.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative border-t border-[var(--color-line)]">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="mb-8 max-w-2xl">
              <p className="eyebrow mb-3">Product preview</p>
              <h2 className="text-3xl leading-tight text-[var(--color-ink)] md:text-[2.6rem]">
                A calm verdict from your own A/B run
              </h2>
              <p className="mt-3 text-[var(--color-muted)]">
                Example earlier-bedtime series — illustrative sample, not live account data.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
              <div className="card flex flex-col justify-between bg-gradient-to-br from-emerald-50 to-white p-7 md:p-8">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="eyebrow">Verdict</p>
                    <VerdictBadge verdict="Keep" />
                  </div>
                  <p className="mt-6 font-display text-4xl leading-tight text-[var(--color-ink)] md:text-5xl">
                    Earlier bedtime
                  </p>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
                    Phase B energy rose versus baseline. The stats engine suggests keeping the habit —
                    AI can narrate the numbers, never invent them.
                  </p>
                </div>
                <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--color-line)] pt-5">
                  <div>
                    <dt className="text-xs text-[var(--color-subtle)]">Mean A</dt>
                    <dd className="font-display text-2xl tabular-nums">5.2</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--color-subtle)]">Mean B</dt>
                    <dd className="font-display text-2xl tabular-nums">7.2</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--color-subtle)]">Change</dt>
                    <dd className="font-display text-2xl tabular-nums text-emerald-700">+38%</dd>
                  </div>
                </dl>
              </div>

              <MetricPhaseChart
                checkIns={previewCheckIns}
                metricLabel="Energy (1–10)"
                phaseALabel="Usual bedtime"
                phaseBLabel="Earlier bedtime"
                meanA={5.2}
                meanB={7.2}
              />
            </div>
          </div>
        </section>

        <section className="relative border-t border-[var(--color-line)] bg-white/50">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.label} className="min-w-0 border-l-2 border-[var(--color-accent-soft)] pl-4">
                <p className="mb-1.5 text-sm font-bold tracking-wide text-[var(--color-accent)]">
                  {feature.label}
                </p>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">{feature.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Logo />
          <Disclaimer />
        </div>
      </footer>
    </div>
  )
}
