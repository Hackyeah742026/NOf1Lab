import { useState } from 'react'
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
  const templates = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates })

  const start = useMutation({
    mutationFn: async (templateKey: string) => {
      const created = await createExperiment(templateKey)
      return startExperiment(created.id)
    },
    onSuccess: async (experiment) => {
      await queryClient.invalidateQueries({ queryKey: ['experiments'] })
      navigate(`/app/experiments/${experiment.id}`)
    },
  })

  const visibleTemplates = sortTemplates(
    (templates.data ?? []).filter(
      (template) => categoryFilter === 'all' || template.category === categoryFilter,
    ),
  )

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
                onClick={() => start.mutate(template.key)}
                className="w-full sm:w-auto"
              >
                {start.isPending && start.variables === template.key
                  ? 'Starting…'
                  : 'Start experiment'}
              </Button>
            </li>
          )
        })}
      </ul>

      <Disclaimer className="mt-10" />
    </AppShell>
  )
}
