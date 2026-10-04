import { Link } from 'react-router-dom'
import { Disclaimer } from '../components/Disclaimer'
import { buttonClass } from '../components/Button'
import { useAuth } from '../auth/AuthContext'

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

export function LandingPage() {
  const { user } = useAuth()

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
            Browse templates
          </Link>
        </div>

        <Disclaimer className="animate-rise-late max-w-xl" />
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
