import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createExperiment, startExperiment } from '../api/experiments'
import { fetchTemplates } from '../api/templates'
import { AppShell } from '../components/AppShell'
import { Disclaimer } from '../components/Disclaimer'

const categoryCopy: Record<string, string> = {
  sport: 'Training load & recovery',
  physical: 'Physical health signals',
  mental: 'Focus & mental wellbeing',
  lifestyle: 'Everyday lifestyle decisions',
  'physical+mental': 'Physical + mental energy',
}

export function TemplatesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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

  return (
    <AppShell>
      <h1 className="mb-2 text-4xl text-[var(--color-ink)]">Experiment templates</h1>
      <p className="mb-3 max-w-2xl text-[var(--color-muted)]">
        Built for sport, physical health, mental wellbeing, and lifestyle decisions — beyond
        passive monitoring.
      </p>
      <p className="mb-8 max-w-2xl text-sm text-[var(--color-muted)]">
        Tip: sign in as the demo user to open a precomputed earlier-bedtime result in under two
        minutes.
      </p>

      {templates.isPending && <p className="text-[var(--color-muted)]">Loading templates…</p>}
      {start.isError && <p className="mb-4 text-red-700">Could not start experiment.</p>}

      <ul className="grid gap-4 md:grid-cols-2">
        {templates.data?.map((template) => (
          <li
            key={template.key}
            className="rounded-2xl border border-emerald-900/10 bg-white/75 p-5 shadow-sm"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {categoryCopy[template.category] ?? template.category}
            </p>
            <h2 className="mb-2 text-2xl text-[var(--color-ink)]">{template.title}</h2>
            <p className="mb-4 text-sm leading-relaxed text-[var(--color-muted)]">
              {template.question}
            </p>
            <p className="mb-4 text-xs text-[var(--color-muted)]">
              {template.daysPerPhase} days/phase · {template.metricLabel}
            </p>
            <button
              type="button"
              disabled={start.isPending}
              onClick={() => start.mutate(template.key)}
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Start
            </button>
          </li>
        ))}
      </ul>

      <Disclaimer className="mt-10" />
    </AppShell>
  )
}
