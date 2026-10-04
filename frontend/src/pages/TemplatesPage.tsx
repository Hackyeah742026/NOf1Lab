import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createExperiment, startExperiment } from '../api/experiments'
import { fetchTemplates } from '../api/templates'
import type { Template } from '../api/types'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Disclaimer } from '../components/Disclaimer'
import { Alert, PageHeader, Skeleton } from '../components/Feedback'

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

const categoryTone: Record<string, string> = {
  sport: 'bg-sky-50 text-sky-800 ring-sky-800/10',
  physical: 'bg-emerald-50 text-emerald-800 ring-emerald-800/10',
  mental: 'bg-indigo-50 text-indigo-800 ring-indigo-800/10',
  lifestyle: 'bg-amber-50 text-amber-800 ring-amber-800/10',
  'physical+mental': 'bg-teal-50 text-teal-800 ring-teal-800/10',
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

  const counts: Record<string, number> = {}
  for (const template of templates.data ?? []) {
    counts[template.category] = (counts[template.category] ?? 0) + 1
  }

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

  // Escape closes the setup dialog.
  useEffect(() => {
    if (!setupTemplate) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeSetup()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <AppShell>
      <PageHeader
        eyebrow="Start something new"
        title="Experiment templates"
        description="Built for sport, physical health, mental wellbeing, and lifestyle decisions — beyond passive monitoring."
      />

      <div role="group" aria-label="Filter by category" className="mb-8 flex flex-wrap gap-2">
        {filterCategories.map((category) => {
          const selected = categoryFilter === category.key
          const count = category.key === 'all' ? templates.data?.length : counts[category.key]
          return (
            <button
              key={category.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategoryFilter(category.key)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                selected
                  ? 'bg-[var(--color-ink)] text-white shadow-sm'
                  : 'bg-white text-[var(--color-muted)] ring-1 ring-[var(--color-line)] hover:text-[var(--color-ink)] hover:ring-[var(--color-line-strong)]',
              ].join(' ')}
            >
              {category.label}
              {count != null && count > 0 && (
                <span className={`text-xs tabular-nums ${selected ? 'text-white/65' : 'text-[var(--color-subtle)]'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {templates.isPending && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} className="h-64" />
          ))}
        </div>
      )}
      {templates.isError && <Alert className="mb-4">Could not load templates. Try refreshing.</Alert>}
      {start.isError && <Alert className="mb-4">Could not start experiment.</Alert>}

      {!templates.isPending && templates.data?.length === 0 && (
        <Alert tone="info">No templates available yet.</Alert>
      )}

      {!templates.isPending &&
        templates.data &&
        templates.data.length > 0 &&
        visibleTemplates.length === 0 && <Alert tone="info">No templates in this category.</Alert>}

      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleTemplates.map((template) => {
          const chip = categoryCopy[template.category] ?? template.category
          const hint = categoryHint[template.category]
          const featured = featuredRank(template.key) < featuredKeys.length

          return (
            <li
              key={template.key}
              className="card group flex flex-col p-5 transition hover:shadow-[var(--shadow-raised)]"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span
                  title={hint}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${categoryTone[template.category] ?? 'bg-slate-50 text-slate-700 ring-slate-800/10'}`}
                >
                  {chip}
                </span>
                {featured && (
                  <span className="text-xs font-semibold text-[var(--color-phase-b)]">★ Popular</span>
                )}
              </div>

              <h2 className="text-xl leading-snug text-[var(--color-ink)]">{template.title}</h2>
              <p className="mt-2 mb-5 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">
                {template.question}
              </p>

              <div className="mb-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[var(--color-surface-muted)] px-3 py-2 ring-1 ring-inset ring-[var(--color-line)]">
                  <p className="text-[var(--color-subtle)]">Duration</p>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {template.daysPerPhase * 2} days · A/B
                  </p>
                </div>
                <div className="min-w-0 rounded-lg bg-[var(--color-surface-muted)] px-3 py-2 ring-1 ring-inset ring-[var(--color-line)]">
                  <p className="text-[var(--color-subtle)]">Metric</p>
                  <p className="truncate font-semibold text-[var(--color-ink)]" title={template.metricLabel}>
                    {template.metricLabel}
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                disabled={start.isPending}
                onClick={() => setSetupTemplate(template)}
                className="w-full group-hover:bg-[var(--color-accent)] group-hover:text-white group-hover:ring-transparent"
              >
                Set up experiment
              </Button>
            </li>
          )
        })}
      </ul>

      {setupTemplate && (
        <div
          className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/40 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={closeSetup}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-wizard-title"
            className="animate-rise max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">New experiment</p>
                <h2 id="setup-wizard-title" className="mt-1.5 text-3xl leading-tight text-[var(--color-ink)]">
                  {setupTemplate.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSetup}
                aria-label="Close"
                className="-mt-1 -mr-2 rounded-lg p-2 text-[var(--color-subtle)] hover:bg-emerald-900/5 hover:text-[var(--color-ink)]"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{setupTemplate.question}</p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[var(--color-accent-soft)]/60 px-4 py-3">
                <p className="text-xs font-bold text-[var(--color-phase-a)]">Phase A · baseline</p>
                <p className="mt-0.5 font-semibold text-[var(--color-ink)]">{setupTemplate.phaseALabel}</p>
                <p className="text-xs text-[var(--color-muted)]">{setupTemplate.daysPerPhase} days</p>
              </div>
              <div className="rounded-xl bg-[var(--color-phase-b-soft)] px-4 py-3">
                <p className="text-xs font-bold text-[var(--color-phase-b)]">Phase B · change</p>
                <p className="mt-0.5 font-semibold text-[var(--color-ink)]">{setupTemplate.phaseBLabel}</p>
                <p className="text-xs text-[var(--color-muted)]">{setupTemplate.daysPerPhase} days</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              Daily metric: <strong className="text-[var(--color-ink)]">{setupTemplate.metricLabel}</strong>
              {setupTemplate.higherIsBetter ? ' · higher is better' : ' · lower is better'}
            </p>

            <label className="mt-5 block">
              <span className="field-label">Your hypothesis</span>
              <textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={3}
                className="field resize-none"
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button variant="ghost" disabled={start.isPending} onClick={closeSetup}>
                Cancel
              </Button>
              <Button disabled={start.isPending} onClick={confirmSetup} className="px-6">
                {start.isPending ? 'Starting…' : 'Start experiment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Disclaimer className="mt-12" />
    </AppShell>
  )
}
