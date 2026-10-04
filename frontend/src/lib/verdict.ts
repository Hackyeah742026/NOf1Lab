import type { ExperimentStatus, Verdict } from '../api/types'

type Tone = {
  /** Chip background + text. */
  chip: string
  /** Large text colour for hero numbers. */
  text: string
  /** Solid swatch (dots, bars). */
  dot: string
  /** Soft panel background. */
  panel: string
}

export const verdictTone: Record<Verdict, Tone & { summary: string }> = {
  Keep: {
    chip: 'bg-emerald-100 text-emerald-900 ring-emerald-800/15',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
    panel: 'from-emerald-50 to-white',
    summary: 'Phase B beat your baseline. The habit earns a place in your routine.',
  },
  Drop: {
    chip: 'bg-rose-100 text-rose-900 ring-rose-800/15',
    text: 'text-rose-800',
    dot: 'bg-rose-600',
    panel: 'from-rose-50 to-white',
    summary: 'Phase B did not help — or made things worse. Safe to let it go.',
  },
  Modify: {
    chip: 'bg-amber-100 text-amber-900 ring-amber-800/15',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    panel: 'from-amber-50 to-white',
    summary: 'There is a signal, but adherence or effect is mixed. Tweak and rerun.',
  },
  Inconclusive: {
    chip: 'bg-slate-100 text-slate-800 ring-slate-800/10',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    panel: 'from-slate-50 to-white',
    summary: 'Not enough difference or data to call it. Consider a longer run.',
  },
}

export const statusTone: Record<ExperimentStatus, { chip: string; dot: string }> = {
  Active: { chip: 'bg-emerald-50 text-emerald-900 ring-emerald-800/15', dot: 'bg-emerald-500' },
  Completed: { chip: 'bg-white text-[var(--color-ink)] ring-emerald-900/15', dot: 'bg-[var(--color-ink)]' },
  Stopped: { chip: 'bg-amber-50 text-amber-900 ring-amber-800/15', dot: 'bg-amber-500' },
  Draft: { chip: 'bg-slate-50 text-slate-700 ring-slate-800/10', dot: 'bg-slate-400' },
}

export function formatDay(day?: string | null, withYear = false) {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return day ?? ''
  const date = new Date(`${day}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return day
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  })
}
