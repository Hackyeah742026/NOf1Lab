import { Link } from 'react-router-dom'
import { Disclaimer } from '../components/Disclaimer'
import { useAuth } from '../auth/AuthContext'

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

      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="animate-rise mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Sport · body · mind · decisions
        </p>
        <h1 className="animate-rise-delay mb-5 max-w-3xl text-5xl leading-[1.05] text-[var(--color-ink)] md:text-7xl">
          N-of-1 Lab
        </h1>
        <p className="animate-rise-late mb-10 max-w-xl text-lg leading-relaxed text-[var(--color-muted)] md:text-xl">
          Scattered health data rarely becomes a decision. Run a short A/B
          experiment on yourself, log a few signals, and get a computed Keep /
          Drop / Modify verdict.
        </p>

        <div className="animate-rise-late mb-10 flex flex-wrap gap-3">
          <Link
            to={user ? '/app' : '/login'}
            className="rounded-md bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            {user ? 'Open dashboard' : 'Start an experiment'}
          </Link>
          <Link
            to={user ? '/app/templates' : '/login'}
            className="rounded-md bg-[var(--color-accent-soft)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-95"
          >
            Browse templates
          </Link>
        </div>

        <Disclaimer className="animate-rise-late max-w-xl" />
      </section>
    </main>
  )
}
