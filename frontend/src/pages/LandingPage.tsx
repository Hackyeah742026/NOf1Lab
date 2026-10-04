import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchShowcase } from '../api/demo'
import type { CheckIn } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button, buttonClass } from '../components/Button'
import { Disclaimer } from '../components/Disclaimer'
import { MetricPhaseChart } from '../components/MetricPhaseChart'

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
      if (!user) {
        await login('demo@nof1lab.local', 'Demo123!')
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
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="glow-orb absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="glow-orb absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(19,40,31,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(19,40,31,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <section className="relative mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-center px-6 py-16">
        <p className="animate-rise mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Personal experiment OS
        </p>
        <h1 className="animate-rise-delay mb-5 max-w-3xl text-5xl leading-[1.05] text-[var(--color-ink)] md:text-7xl">
          N-of-1 Lab
        </h1>
        <p className="animate-rise-late mb-10 max-w-xl text-lg leading-relaxed text-[var(--color-muted)] md:text-xl">
          Scattered health data rarely becomes a decision. Run a short A/B
          experiment on yourself, log a few signals, and get a computed Keep /
          Drop / Modify verdict.
        </p>

        <div className="animate-rise-late mb-8 flex flex-wrap gap-3">
          <Link to={user ? '/app' : '/login'} className={buttonClass('primary', 'px-7 py-3 text-base')}>
            {user ? 'Open dashboard' : 'Start an experiment'}
          </Link>
          <Link
            to={user ? '/app/templates' : '/login'}
            className={buttonClass('secondary', 'px-7 py-3 text-base')}
          >
            {user ? 'Browse templates' : 'Sign in to browse'}
          </Link>
          <Button
            variant="ghost"
            className="px-7 py-3 text-base"
            disabled={demoBusy}
            onClick={() => void openDemoResult()}
          >
            {demoBusy ? 'Opening…' : 'Open demo result'}
          </Button>
        </div>

        {demoError && <p className="mb-4 text-sm text-red-700">{demoError}</p>}

        <Disclaimer className="animate-rise-late max-w-xl" />
      </section>

      <section className="relative border-t border-emerald-900/10 bg-white/35 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="mb-6 max-w-xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Product preview
            </p>
            <h2 className="text-3xl text-[var(--color-ink)] md:text-4xl">
              A calm Keep / Drop / Modify call from your own A/B run
            </h2>
            <p className="mt-3 text-[var(--color-muted)]">
              Example earlier-bedtime series — illustrative sample, not live account data.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
            <div className="flex flex-col justify-between rounded-2xl border border-emerald-900/10 bg-[var(--color-panel)] p-6 shadow-sm md:p-8">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Verdict preview
                </p>
                <span className="mt-4 inline-flex items-center rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-sm font-bold uppercase tracking-wide text-[var(--color-accent)]">
                  Keep
                </span>
                <p className="mt-5 text-4xl text-[var(--color-ink)] md:text-5xl">Earlier bedtime</p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
                  Phase B energy rose versus baseline. Stats engine suggests keeping the habit —
                  AI can narrate the numbers, never invent them.
                </p>
              </div>
              <div className="mt-8 h-2 overflow-hidden rounded-full bg-emerald-900/10">
                <div className="h-full w-[62%] rounded-full bg-[var(--color-accent)]" />
              </div>
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

      <section className="relative border-t border-emerald-900/10 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.label} className="min-w-0">
              <p className="mb-1.5 font-body text-sm font-bold tracking-wide text-[var(--color-accent)]">
                {feature.label}
              </p>
              <p className="font-body text-sm leading-relaxed text-[var(--color-muted)]">
                {feature.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
