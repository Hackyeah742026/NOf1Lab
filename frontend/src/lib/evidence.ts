export type EvidenceStrength = 'strong' | 'moderate' | 'weak'

export type EvidenceConfidence = {
  pValue: number
  ciLow: number
  ciHigh: number
  strength: EvidenceStrength
  method: string
  permutations: number
}

export type EvidenceWarning = {
  code: string
  message: string
}

export type ParsedEvidence = {
  confidence: EvidenceConfidence | null
  warnings: EvidenceWarning[]
  higherIsBetter: boolean
}

/** Reads the optional confidence block the stats engine embeds in evidenceJson. */
export function parseEvidence(json?: string | null): ParsedEvidence {
  const empty: ParsedEvidence = { confidence: null, warnings: [], higherIsBetter: true }
  if (!json) return empty
  try {
    const raw = JSON.parse(json) as Record<string, unknown>
    const confidence = raw.confidence as EvidenceConfidence | undefined
    const warnings = Array.isArray(raw.warnings) ? (raw.warnings as EvidenceWarning[]) : []
    return {
      confidence:
        confidence && typeof confidence.pValue === 'number' && typeof confidence.ciLow === 'number'
          ? confidence
          : null,
      warnings,
      higherIsBetter: raw.higherIsBetter !== false,
    }
  } catch {
    return empty
  }
}
