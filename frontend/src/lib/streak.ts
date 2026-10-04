import type { CheckIn } from '../api/types'

/** UTC calendar day as YYYY-MM-DD — the API stamps check-ins with DateOnly.FromDateTime(DateTime.UtcNow). */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function previousDay(day: string): string {
  const date = new Date(`${day}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function findTodayCheckIn(checkIns: CheckIn[] | undefined, today = utcToday()) {
  return checkIns?.find((checkIn) => checkIn.day === today)
}

/**
 * Consecutive logged days ending today — or yesterday, so the streak is not
 * shown as broken before the user has had a chance to log today.
 */
export function currentStreak(checkIns: CheckIn[] | undefined, today = utcToday()): number {
  if (!checkIns || checkIns.length === 0) return 0
  const days = new Set(checkIns.map((checkIn) => checkIn.day))
  let cursor = days.has(today) ? today : previousDay(today)
  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor = previousDay(cursor)
  }
  return streak
}
