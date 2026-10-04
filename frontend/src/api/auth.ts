import { apiFetch } from './client'
import type { AuthResponse, User } from './types'

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })
}

export function register(email: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password, language: 'en' }),
  })
}

export function fetchMe() {
  return apiFetch<User>('/api/auth/me')
}
