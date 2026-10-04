import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchShowcase } from '../api/demo'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { Disclaimer } from '../components/Disclaimer'
import { Alert } from '../components/Feedback'
import { Logo, LogoMark } from '../components/Logo'
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
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-[var(--color-accent)] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />
        <Link to="/" className="relative inline-flex items-center gap-2.5">
          <LogoMark className="h-8 w-8 rounded-[9px] ring-1 ring-white/30" />
          <span className="font-display text-xl">N-of-1 Lab</span>
        </Link>

        <div className="relative max-w-md">
          <p className="font-display text-4xl leading-tight">
            “Does an earlier bedtime actually give me more energy?”
          </p>
          <p className="mt-4 text-white/75">
            Answer questions like this with a 10-day A/B run on yourself — and a verdict computed from
            your own numbers.
          </p>
          <div className="mt-10 flex items-end gap-2" aria-hidden>
            {[40, 48, 36, 44, 52].map((height, index) => (
              <span key={`a${index}`} className="w-5 rounded-md bg-white/35" style={{ height }} />
            ))}
            <span className="mx-1 h-24 w-px bg-white/30" />
            {[64, 72, 60, 84, 70].map((height, index) => (
              <span key={`b${index}`} className="w-5 rounded-md bg-[#f2c98f]" style={{ height }} />
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          Self-experimentation and coaching only — not medical advice.
        </p>
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-4xl text-[var(--color-ink)]">Welcome back</h1>
          <p className="mt-2 text-[var(--color-muted)]">Sign in, register, or jump straight into the demo.</p>

          <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-accent-soft)]/50 p-4">
            <Button className="w-full py-3 text-base" disabled={busy} onClick={() => void continueAsDemo()}>
              {busy ? 'Continuing…' : 'Continue as demo'}
            </Button>
            <p className="mt-2.5 text-center text-xs text-[var(--color-muted)]">
              Seeded account with a ready-made result
            </p>
          </div>

          <div className="my-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
            <span className="h-px flex-1 bg-[var(--color-line-strong)]" />
            or with email
            <span className="h-px flex-1 bg-[var(--color-line-strong)]" />
          </div>

          <form className="space-y-4" onSubmit={(e) => void submit('login', e)}>
            <label className="block">
              <span className="field-label">Email</span>
              <input
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block">
              <span className="field-label">Password</span>
              <input
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>

            {error && <Alert>{error}</Alert>}

            <div className="grid grid-cols-2 gap-3 pt-2">
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

          <p className="mt-6 text-xs text-[var(--color-subtle)]">
            Demo: <code className="rounded bg-white px-1 py-0.5 ring-1 ring-[var(--color-line)]">{DEMO_EMAIL}</code>{' '}
            / <code className="rounded bg-white px-1 py-0.5 ring-1 ring-[var(--color-line)]">{DEMO_PASSWORD}</code>
          </p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-semibold text-[var(--color-accent)] hover:underline"
          >
            ← Back to landing
          </Link>
          <Disclaimer className="mt-8 lg:hidden" />
        </div>
      </main>
    </div>
  )
}
