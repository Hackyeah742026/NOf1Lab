import { apiFetch } from './client'
import type { Template } from './types'

export function fetchTemplates() {
  return apiFetch<Template[]>('/api/templates')
}
