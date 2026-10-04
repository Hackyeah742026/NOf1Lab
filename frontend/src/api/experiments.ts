import { apiFetch } from './client'
import type {
  AnalysisPreview,
  CheckIn,
  Experiment,
  ExperimentResult,
  ExplainResponse,
} from './types'

export function fetchExperiments() {
  return apiFetch<Experiment[]>('/api/experiments')
}

export function fetchExperiment(id: string) {
  return apiFetch<Experiment>(`/api/experiments/${id}`)
}

export function createExperiment(templateKey: string, hypothesis?: string) {
  return apiFetch<Experiment>('/api/experiments', {
    method: 'POST',
    body: JSON.stringify({ templateKey, hypothesis }),
  })
}

export function startExperiment(id: string) {
  return apiFetch<Experiment>(`/api/experiments/${id}/start`, { method: 'POST' })
}

export function stopExperiment(id: string, reason?: string) {
  return apiFetch<Experiment>(`/api/experiments/${id}/stop`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function fetchCheckIns(id: string) {
  return apiFetch<CheckIn[]>(`/api/experiments/${id}/check-ins`)
}

export function createCheckIn(
  id: string,
  payload: {
    metricValue: number
    adhered: boolean
    notes?: string
    safetyFlag: boolean
    day?: string
  },
) {
  return apiFetch<CheckIn>(`/api/experiments/${id}/check-ins`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function importCheckIns(id: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<CheckIn[]>(`/api/experiments/${id}/import`, {
    method: 'POST',
    body: form,
  })
}

export function completeExperiment(id: string) {
  return apiFetch<ExperimentResult>(`/api/experiments/${id}/complete`, {
    method: 'POST',
  })
}

export function fetchResult(id: string) {
  return apiFetch<ExperimentResult>(`/api/experiments/${id}/result`)
}

export function fetchPreviewAnalysis(id: string) {
  return apiFetch<AnalysisPreview>(`/api/experiments/${id}/analysis/preview`)
}

export function explainExperiment(id: string) {
  return apiFetch<ExplainResponse>(`/api/experiments/${id}/explain`, {
    method: 'POST',
  })
}
