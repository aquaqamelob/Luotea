import path from 'path'

export const DATA_ROOT = path.join(process.cwd(), '..', 'Luotea-Hackathon-2026')
export const OUTPUT_ROOT = path.join(process.cwd(), '..', 'output')

export const PATHS = {
  workOrders: path.join(DATA_ROOT, 'Work orders', 'work_orders_anonymized 1.csv'),
  alarms: path.join(DATA_ROOT, 'Alarms', 'alarms.csv'),
  schedule: path.join(
    DATA_ROOT,
    'Maintenance schedule (EH-työt)',
    'Scheduled maitenance plans.csv',
  ),
} as const

export const TARGET_SITES = new Set([998389833, 999154922, 999488386])

export const SITE_NAMES: Record<number, string> = {
  998389833: 'Lentokentänkatu 11',
  999154922: 'Venttiilitehdas',
  999488386: 'Toimistotalo',
}

export const ALARM_START_DATE = new Date('2025-01-20')

export const HOURLY_RATE_EUR = 80
export const AVOIDED_DOWNTIME_EUR = 10_000

export const ALARM_WINDOW_DAYS = 7
export const ALARM_SEND_NOW_THRESHOLD = 5
export const ALARM_CANCEL_THRESHOLD = 0
export const DAYS_TO_NEXT_EH_SEND_NOW = 14
export const DAYS_TO_NEXT_EH_CANCEL = 3
export const REACTIVE_AFTER_EH_DAYS = 14
export const ALARM_BASELINE_DAYS = 30

export const EQUIPMENT_CODE_PATTERN =
  /\b\d{3}[A-Z]{2}\d{2}(?:\.\d+)?\b|\b\d{3}-[A-Z]{2}\d{2}(?:\.\d+)?\b|\bJJ\d{2}[A-Z]{2}\d{2}\b/gi

export const FEATURED_CASES = ['54960238', '54716854', '54882174'] as const

export type RecommendationAction =
  | 'SEND_NOW'
  | 'CANCEL_INSPECTION'
  | 'ACCELERATE_INSPECTION'
  | 'AUDIT_PLAN'
  | 'MONITOR'

export const RECOMMENDATION_LABELS: Record<RecommendationAction, string> = {
  SEND_NOW: 'SEND TECHNICIAN NOW',
  CANCEL_INSPECTION: 'CANCEL INSPECTION',
  ACCELERATE_INSPECTION: 'ACCELERATE INSPECTION',
  AUDIT_PLAN: 'AUDIT PM PLAN',
  MONITOR: 'MONITOR',
}
