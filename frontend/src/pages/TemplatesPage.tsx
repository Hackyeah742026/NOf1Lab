import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createExperiment, startExperiment } from '../api/experiments'
import { fetchTemplates } from '../api/templates'
import type { Template } from '../api/types'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Disclaimer } from '../components/Disclaimer'

const categoryCopy: Record<string, string> = {
  sport: 'Sport',
  physical: 'Body',
  mental: 'Mind',
  lifestyle: 'Lifestyle',
  'physical+mental': 'Body + Mind',
}

const categoryHint: Record<string, string> = {
  sport: 'Training load & recovery',
  physical: 'Physical health signals',
  mental: 'Focus & mental wellbeing',
  lifestyle: 'Everyday lifestyle decisions',
  'physical+mental': 'Physical + mental energy',
}

const filterCategories = [
  { key: 'all', label: 'All' },
  { key: 'sport', label: 'Sport' },
  { key: 'physical', label: 'Body' },
  { key: 'mental', label: 'Mind' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'physical+mental', label: 'Body + Mind' },
] as const

type FilterKey = (typeof filterCategories)[number]['key']

const featuredKeys = ['earlier-bedtime', 'morning-light', 'training-load'] as const

function featuredRank(key: string) {
  const index = featuredKeys.indexOf(key as (typeof featuredKeys)[number])
  return index === -1 ? featuredKeys.length : index
}

function sortTemplates(templates: Template[]) {
  return [...templates].sort((a, b) => {
    const rankDiff = featuredRank(a.key) - featuredRank(b.key)
    if (rankDiff !== 0) return rankDiff
    return a.title.localeCompare(b.title)
  })
}

export function TemplatesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState<FilterKey>('all')
  const [setupTemplate, setSetupTemplate] = useState<Template | null>(null)
  const [hypothesis, setHypothesis] = useState('')

  const templates = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates })

  useEffect(() => {
    if (!setupTemplate) return
    setHypothesis(setupTemplate.question)
  }, [setupTemplate])

  const start = useMutation({
    mutationFn: async ({
      templateKey,
      hypothesis: hypothesisText,
    }: {
      templateKey: string
      hypothesis: string
    }) => {
      const created = await createExperiment(templateKey, hypothesisText.trim() || undefined)
      return startExperiment(created.id)
    },
    onSuccess: async (experiment) => {
      setSetupTemplate(null)
      await queryClient.invalidateQueries({ queryKey: ['experiments'] })
      navigate(`/app/experiments/${experiment.id}`)
    },
  })

  const visibleTemplates = sortTemplates(
    (templates.data ?? []).filter(
      (template) => categoryFilter === 'all' || template.category === categoryFilter,
    ),
  )

  function closeSetup() {
    if (start.isPending) return
    setSetupTemplate(null)
    setHypothesis('')
  }

  function confirmSetup() {
    if (!setupTemplate) return
    start.mutate({
      templateKey: setupTemplate.key,
      hypothesis,
    })
  }

  return (
    <AppShell>
      <h1 className="mb-2 font-body text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
        Experiment templates
      </h1>
      <p className="mb-3 max-w-2xl font-body text-[var(--color-muted)]">
        Built for sport, physical health, mental wellbeing, and lifestyle decisions — beyond
        passive monitoring.
      </p>
      <p className="mb-6 max-w-2xl font-body text-sm text-[var(--color-muted)]">
        Tip: sign in as the demo user to open a precomputed earlier-bedtime result in under two
        minutes.
      </p>

      <div
        role="group"
        aria-label="Filter by category"
        className="mb-8 flex flex-wrap gap-2"
      >
        {filterCategories.map((category) => {
          const selected = categoryFilter === category.key
          return (
            <button
              key={category.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategoryFilter(category.key)}
              className={[
                'rounded-full px-3.5 py-1.5 font-body text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                selected
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'bg-white/70 text-[var(--color-muted)] ring-1 ring-emerald-900/10 hover:text-[var(--color-ink)]',
              ].join(' ')}
            >
              {category.label}
            </button>
          )
        })}
      </div>

      {templates.isPending && <p className="font-body text-[var(--color-muted)]">Loading templates…</p>}
      {templates.isError && (
        <p className="mb-4 font-body text-red-700">Could not load templates. Try refreshing.</p>
      )}
      {start.isError && <p className="mb-4 font-body text-red-700">Could not start experiment.</p>}

      {!templates.isPending && templates.data?.length === 0 && (
        <p className="font-body text-[var(--color-muted)]">No templates available yet.</p>
      )}

      {!templates.isPending && templates.data && templates.data.length > 0 && visibleTemplates.length === 0 && (
        <p className="font-body text-[var(--color-muted)]">No templates in this category.</p>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {visibleTemplates.map((template) => {
          const chip = categoryCopy[template.category] ?? template.category
          const hint = categoryHint[template.category]

          return (
            <li
              key={template.key}
              className="flex flex-col rounded-2xl border border-emerald-900/10 bg-white/80 p-5 shadow-sm ring-1 ring-white/60"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 font-body text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
                  {chip}
                </span>
                {hint && (
                  <span className="font-body text-xs text-[var(--color-muted)]">{hint}</span>
                )}
              </div>

              <h2 className="mb-2 font-body text-xl font-semibold tracking-tight text-[var(--color-ink)]">
                {template.title}
              </h2>
              <p className="mb-4 flex-1 font-body text-sm leading-relaxed text-[var(--color-muted)]">
                {template.question}
              </p>
              <p className="mb-5 font-body text-xs text-[var(--color-muted)]">
                {template.daysPerPhase} days/phase · {template.metricLabel}
              </p>
              <Button
                disabled={start.isPending}
                onClick={() => setSetupTemplate(template)}
                className="w-full sm:w-auto"
              >
                Start experiment
              </Button>
            </li>
          )
        })}
      </ul>

      {setupTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/35 p-4 sm:items-center"
          role="presentation"
          onClick={closeSetup}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-wizard-title"
            className="w-full max-w-lg rounded-2xl border border-emerald-900/10 bg-[var(--color-bg)] p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Setup wizard
            </p>
            <h2 id="setup-wizard-title" className="mt-2 text-3xl text-[var(--color-ink)]">
              {setupTemplate.title}
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-[var(--color-muted)]">
              {setupTemplate.question}
            </p>

            <dl className="mt-5 grid gap-3 rounded-xl border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--color-muted)]">Phase A</dt>
                <dd className="font-semibold text-[var(--color-ink)]">{setupTemplate.phaseALabel}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Phase B</dt>
                <dd className="font-semibold text-[var(--color-ink)]">{setupTemplate.phaseBLabel}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Days per phase</dt>
                <dd className="font-semibold text-[var(--color-ink)]">{setupTemplate.daysPerPhase}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Metric</dt>
                <dd className="font-semibold text-[var(--color-ink)]">{setupTemplate.metricLabel}</dd>
              </div>
            </dl>

            <label className="mt-5 block text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">Your hypothesis</span>
              <textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-emerald-900/15 bg-white px-3 py-2 font-body text-[var(--color-ink)]"
              />
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled={start.isPending} onClick={confirmSetup}>
                {start.isPending ? 'Starting…' : 'Confirm'}
              </Button>
              <Button variant="secondary" disabled={start.isPending} onClick={closeSetup}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Disclaimer className="mt-10" />
    </AppShell>
  )
}
