import { Link } from 'react-router-dom'
import { Disclaimer } from '../components/Disclaimer'
import { useAuth } from '../auth/AuthContext'

export function LandingPage() {
  const { user } = useAuth()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Personal experiment OS
      </p>
      <h1 className="mb-4 text-5xl leading-tight text-[var(--color-ink)] md:text-6xl">
        N-of-1 Lab
      </h1>
      <p className="mb-8 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]">
        Run short A/B lifestyle experiments, log minimal signals, and get a
        computed Keep / Drop / Modify verdict. AI only explains the numbers.
      </p>

      <div className="mb-10 flex flex-wrap gap-3">
        <Link
          to={user ? '/app' : '/login'}
          className="rounded-md bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {user ? 'Open dashboard' : 'Start an experiment'}
        </Link>
      </div>

      <Disclaimer />
    </main>
  )
}
