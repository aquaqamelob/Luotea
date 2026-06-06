import type { RecommendationAction } from './config'

export function recommendationBadgeColor(action: RecommendationAction | string): 'red' | 'green' | 'amber' | 'purple' | 'zinc' {
  const label = String(action)
  if (label.includes('SEND') || label === 'WYSLIJ_TECHNIKA_TERAZ') return 'red'
  if (label.includes('CANCEL') || label === 'ANULUJ_PRZEGLAD') return 'green'
  if (label.includes('ACCELERATE') || label === 'PRZYSPIESZ_PRZEGLAD') return 'amber'
  if (label.includes('AUDIT') || label === 'AUDYT_PLANU') return 'purple'
  return 'zinc'
}

export function formatDaysUntil(days: number | null): string {
  if (days == null) return '—'
  if (days <= 0) return 'Today / tomorrow'
  return `In ${days} days`
}
