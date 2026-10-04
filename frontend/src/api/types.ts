export type User = {
  id: string
  email: string
  language: string
}

export type AuthResponse = {
  token: string
  user: User
}

export type Template = {
  key: string
  title: string
  question: string
  description: string
  category: string
  metricKey: string
  metricLabel: string
  daysPerPhase: number
  phaseALabel: string
  phaseBLabel: string
  higherIsBetter: boolean
}

export type ExperimentStatus = 'Draft' | 'Active' | 'Completed' | 'Stopped'
export type Verdict = 'Keep' | 'Drop' | 'Modify' | 'Inconclusive'
export type ExperimentPhase = 'A' | 'B'

export type ExperimentResult = {
  experimentId: string
  meanA: number
  meanB: number
  delta: number
  effectSize: number
  adherenceA: number
  adherenceB: number
  sampleSizeA: number
  sampleSizeB: number
  verdict: Verdict
  evidenceJson: string
}

export type Experiment = {
  id: string
  templateKey: string
  templateTitle?: string | null
  hypothesis: string
  status: ExperimentStatus
  startDate?: string | null
  phaseAEnd?: string | null
  endDate?: string | null
  stopReason?: string | null
  checkInCount: number
  result?: ExperimentResult | null
}

export type CheckIn = {
  id: string
  day: string
  phase: ExperimentPhase
  metricValue: number
  adhered: boolean
  notes?: string | null
  safetyFlag: boolean
}

export type ExplainResponse = {
  explanation: string
  suggestedNextTemplateKey?: string | null
  evidenceKeys: string[]
  usedFallback: boolean
}
