import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchShowcase } from '../api/demo'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { Disclaimer } from '../components/Disclaimer'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../lib/demoAccount'

export function LoginPage() {
  const { user, loading, login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const continueDemoResult = searchParams.get('continue') === 'demo-result'
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (loading || !continueDemoResult) return
    let cancelled = false
    setBusy(true)

    async function openShowcaseResult() {
      try {
        // Deep link: ensure demo account before showcase (even if another user was signed in).
        if (!user || user.email !== DEMO_EMAIL) {
          await login(DEMO_EMAIL, DEMO_PASSWORD)
        }
        if (cancelled) return
        const showcase = await fetchShowcase()
        if (cancelled) return
        navigate(`/app/experiments/${showcase.experimentId}/result`, {
          replace: true,
          state: { fromShowcase: true },
        })
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Could not open demo result.')
        setBusy(false)
      }
    }

    void openShowcaseResult()
    return () => {
      cancelled = true
    }
  }, [loading, user, continueDemoResult, login, navigate])

  if (user && !continueDemoResult) {
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
      if (!continueDemoResult) {
        navigate('/app')
      }
      // With continue=demo-result, the effect above opens the showcase result.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Authentication failed.')
      setBusy(false)
    }
  }

  async function continueAsDemo() {
    setBusy(true)
    setError(null)
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD)
      if (!continueDemoResult) {
        navigate('/app')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Demo sign-in failed.')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-4xl text-[var(--color-ink)]">Sign in</h1>
      <p className="mb-8 text-[var(--color-muted)]">
        Use the seeded demo account or register a new one.
      </p>

      <Button
        className="mb-8 w-full py-3 text-base"
        disabled={busy}
        onClick={() => void continueAsDemo()}
      >
        {busy ? 'Continuing…' : 'Continue as demo'}
      </Button>

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
          <Button type="submit" disabled={busy}>
            Sign in
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={(e) => void submit('register', e)}
          >
            Register
          </Button>
        </div>
      </form>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        Demo: <code>{DEMO_EMAIL}</code> / <code>{DEMO_PASSWORD}</code>
      </p>
      <Link to="/" className="mt-4 text-sm font-semibold text-[var(--color-accent)] hover:underline">
        Back to landing
      </Link>
      <Disclaimer className="mt-8" />
    </main>
  )
}
