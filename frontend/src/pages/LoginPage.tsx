import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Disclaimer } from '../components/Disclaimer'

export function LoginPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@nof1lab.local')
  const [password, setPassword] = useState('Demo123!')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to="/app" replace />
  }

  async function submit(mode: 'login' | 'register', event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      navigate('/app')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-4xl text-[var(--color-ink)]">Sign in</h1>
      <p className="mb-8 text-[var(--color-muted)]">
        Use the seeded demo account or register a new one.
      </p>

      <form className="space-y-4" onSubmit={(e) => void submit('login', e)}>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--color-muted)]">Email</span>
          <input
            className="w-full rounded-md border border-emerald-900/15 bg-white px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--color-muted)]">Password</span>
          <input
            className="w-full rounded-md border border-emerald-900/15 bg-white px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Sign in
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={(e) => void submit('register', e)}
            className="rounded-md bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
          >
            Register
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        Demo: <code>demo@nof1lab.local</code> / <code>Demo123!</code>
      </p>
      <Link to="/" className="mt-4 text-sm font-semibold text-[var(--color-accent)] hover:underline">
        Back to landing
      </Link>
      <Disclaimer className="mt-8" />
    </main>
  )
}
