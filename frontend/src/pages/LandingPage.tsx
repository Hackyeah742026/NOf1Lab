import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchHealth } from '../api/health'
import { getApiUrl } from '../api/client'

export function LandingPage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
  })

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
          to="/login"
          className="rounded-md bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Start an experiment
        </Link>
        <a
          href={`${getApiUrl()}/scalar`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-[var(--color-accent-soft)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-95"
        >
          API docs
        </a>
      </div>

      <p className="mb-6 text-sm text-[var(--color-muted)]">
        {health.isPending && 'Checking API…'}
        {health.isError && 'API offline — start the backend on :5154.'}
        {health.isSuccess && `API ${health.data.status} at ${getApiUrl()}`}
      </p>

      <p className="max-w-xl text-xs leading-relaxed text-[var(--color-muted)]">
        Self-experimentation and coaching only — not medical advice, diagnosis,
        or treatment.
      </p>
    </main>
  )
}
