import { apiFetch } from './client'
import type { DemoShowcase } from './types'

export function fetchShowcase() {
  return apiFetch<DemoShowcase>('/api/demo/showcase')
}
