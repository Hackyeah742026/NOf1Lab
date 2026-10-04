import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-4xl text-[var(--color-ink)]">Sign in</h1>
      <p className="mb-8 text-[var(--color-muted)]">
        Auth endpoints are stubbed for now. Demo login lands in the next
        slice.
      </p>
      <Link
        to="/"
        className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
      >
        Back to landing
      </Link>
    </main>
  )
}
