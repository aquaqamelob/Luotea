import {
  ALARM_START_DATE,
  EQUIPMENT_CODE_PATTERN,
  PATHS,
  TARGET_SITES,
} from './config'
import { readCsvFile } from './csv'

export type WorkOrder = {
  WO_NO: string
  CUSTOMER_NO: number
  CUSTOMER_SITE_NO: number
  customer_site_name: string
  CONTRACT: string
  WORK_ORDER_TYPE_ENG: string
  WORK_TYPE_DESCRIPTION_ENG: string
  WORK_DESCRIPTION: string
  WORK_ORDER_PERFORMED_ACTION: string
  PM_NO: string
  PM_ACTION_DESCR: string
  WORK_STARTED_DATETIME: string
  WORK_FINISHED_DATETIME: string
  WORKTIME_HOURS: string
  WORK_FINISHED_DAYS: string
  started: Date | null
  finished: Date | null
  hours: number
  days: number
  equipmentCodes: Set<string>
}

export type Alarm = {
  ALERT_ID: string
  ALERT_EVENT_ID: string
  CUSTOMER_NO: number
  CUSTOMER_SITE_NO: number
  CUSTOMER_SITE_NAME: string
  EVENT_TIME: Date | null
  EVENT_DESCRIPTION: string
  ALERT_TYPE: string
  LOG_ONLY: string
  WORKORDER_NO: string
  isActionable: boolean
  equipmentCodes: Set<string>
}

export type MaintenancePlan = {
  PM_NO: number
  CUSTOMER_SITE_NO: number
  customer_site_name: string
  ACTION_DESCR: string
  ACTION_DESCR_ENG: string
  INTERVAL: number
  PM_INTERVAL_UNIT: string
  PLAN_HRS: number
  START_DATE: Date | null
  OBJSTATE: string
  LAST_UPDATED: string
}

export function extractEquipmentCodes(text: string | undefined | null): Set<string> {
  if (!text) return new Set()
  const matches = text.match(EQUIPMENT_CODE_PATTERN) ?? []
  return new Set(matches.map((m) => m.toUpperCase().split('.')[0]))
}

export function parseFiDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const [, d, m, y, h, min] = match
  return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min))
}

export function parseIsoDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value.trim().slice(0, 19).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function loadWorkOrders(): WorkOrder[] {
  const rows = readCsvFile(PATHS.workOrders, ';', 'latin1')
  return rows.map((r) => {
    const desc = r.WORK_DESCRIPTION ?? ''
    const action = r.WORK_ORDER_PERFORMED_ACTION ?? ''
    return {
      WO_NO: r.WO_NO ?? '',
      CUSTOMER_NO: Number(r.CUSTOMER_NO),
      CUSTOMER_SITE_NO: Number(r.CUSTOMER_SITE_NO),
      customer_site_name: r.customer_site_name ?? '',
      CONTRACT: r.CONTRACT ?? '',
      WORK_ORDER_TYPE_ENG: r.WORK_ORDER_TYPE_ENG ?? '',
      WORK_TYPE_DESCRIPTION_ENG: r.WORK_TYPE_DESCRIPTION_ENG ?? '',
      WORK_DESCRIPTION: desc,
      WORK_ORDER_PERFORMED_ACTION: action,
      PM_NO: r.PM_NO ?? '',
      PM_ACTION_DESCR: r.PM_ACTION_DESCR ?? '',
      WORK_STARTED_DATETIME: r.WORK_STARTED_DATETIME ?? '',
      WORK_FINISHED_DATETIME: r.WORK_FINISHED_DATETIME ?? '',
      WORKTIME_HOURS: r.WORKTIME_HOURS ?? '',
      WORK_FINISHED_DAYS: r.WORK_FINISHED_DAYS ?? '',
      started: parseFiDate(r.WORK_STARTED_DATETIME),
      finished: parseFiDate(r.WORK_FINISHED_DATETIME),
      hours: Number(r.WORKTIME_HOURS) || 0,
      days: Number(r.WORK_FINISHED_DAYS) || 0,
      equipmentCodes: extractEquipmentCodes(`${desc} ${action}`),
    }
  })
}

export function loadAlarms(): Alarm[] {
  const rows = readCsvFile(PATHS.alarms, ',', 'utf-8')
  return rows.map((r) => ({
    ALERT_ID: r.ALERT_ID ?? '',
    ALERT_EVENT_ID: r.ALERT_EVENT_ID ?? '',
    CUSTOMER_NO: Number(r.CUSTOMER_NO),
    CUSTOMER_SITE_NO: Number(r.CUSTOMER_SITE_NO),
    CUSTOMER_SITE_NAME: r.CUSTOMER_SITE_NAME ?? '',
    EVENT_TIME: parseIsoDate(r.EVENT_TIME),
    EVENT_DESCRIPTION: r.EVENT_DESCRIPTION ?? '',
    ALERT_TYPE: r.ALERT_TYPE ?? '',
    LOG_ONLY: r.LOG_ONLY ?? '',
    WORKORDER_NO: r.WORKORDER_NO ?? '',
    isActionable: !r.LOG_ONLY && r.ALERT_TYPE !== 'INFO',
    equipmentCodes: extractEquipmentCodes(r.EVENT_DESCRIPTION),
  }))
}

export function loadSchedule(): MaintenancePlan[] {
  const rows = readCsvFile(PATHS.schedule, ',', 'utf-8')
  const byPm = new Map<number, MaintenancePlan>()

  for (const r of rows) {
    const pmNo = Number(r.PM_NO)
    const siteNo = Number(r.CUSTOMER_SITE_NO)
    if (!TARGET_SITES.has(siteNo)) continue

    const plan: MaintenancePlan = {
      PM_NO: pmNo,
      CUSTOMER_SITE_NO: siteNo,
      customer_site_name: r.customer_site_name ?? '',
      ACTION_DESCR: r.ACTION_DESCR ?? '',
      ACTION_DESCR_ENG: r.ACTION_DESCR_ENG ?? '',
      INTERVAL: Number(r.INTERVAL) || 0,
      PM_INTERVAL_UNIT: r.PM_INTERVAL_UNIT ?? '',
      PLAN_HRS: Number(r.PLAN_HRS) || 0,
      START_DATE: parseIsoDate(r.START_DATE),
      OBJSTATE: r.OBJSTATE ?? '',
      LAST_UPDATED: r.LAST_UPDATED ?? '',
    }

    const existing = byPm.get(pmNo)
    if (!existing || (r.LAST_UPDATED ?? '') >= existing.LAST_UPDATED) {
      byPm.set(pmNo, plan)
    }
  }

  return [...byPm.values()]
}

export function filterTargetSites<T extends { CUSTOMER_SITE_NO: number }>(rows: T[]): T[] {
  return rows.filter((r) => TARGET_SITES.has(r.CUSTOMER_SITE_NO))
}

export function getReactiveRepairs(wo: WorkOrder[]): WorkOrder[] {
  return wo.filter(
    (r) =>
      r.WORK_ORDER_TYPE_ENG === 'On-demand work' &&
      r.WORK_TYPE_DESCRIPTION_ENG.includes('Repairs') &&
      (r.CONTRACT === 'KH' || r.CONTRACT === 'KT') &&
      r.started &&
      r.started >= ALARM_START_DATE,
  )
}

export function getScheduledWork(wo: WorkOrder[]): WorkOrder[] {
  return wo.filter((r) => r.WORK_ORDER_TYPE_ENG === 'Scheduled work')
}

export function countAlarmsBefore(
  alarms: Alarm[],
  customerNo: number | null,
  siteNo: number,
  end: Date,
  windowDays = 7,
  equipmentCodes?: Set<string>,
): { unique: number; rows: number; first: Date | null } {
  const start = addDays(end, -windowDays)
  let subset = alarms.filter(
    (a) =>
      (customerNo === null || a.CUSTOMER_NO === customerNo) &&
      a.CUSTOMER_SITE_NO === siteNo &&
      a.isActionable &&
      a.EVENT_TIME &&
      a.EVENT_TIME >= start &&
      a.EVENT_TIME < end,
  )

  if (equipmentCodes && equipmentCodes.size > 0) {
    subset = subset.filter((a) => [...a.equipmentCodes].some((c) => equipmentCodes.has(c)))
  }

  if (subset.length === 0) return { unique: 0, rows: 0, first: null }

  const ids = new Set(subset.map((a) => a.ALERT_ID))
  const first = subset.reduce(
    (min, a) => (a.EVENT_TIME && (!min || a.EVENT_TIME < min) ? a.EVENT_TIME : min),
    null as Date | null,
  )
  return { unique: ids.size, rows: subset.length, first }
}

export function intervalToDays(interval: number, unit: string): number | null {
  if (!interval || !unit) return null
  const u = unit.trim().toLowerCase()
  if (u === 'day') return interval
  if (u === 'week') return interval * 7
  if (u === 'month') return interval * 30
  if (u === 'year') return interval * 365
  return null
}

export function computeNextInspection(
  pmNo: number,
  schedule: MaintenancePlan[],
  ehWork: WorkOrder[],
  referenceDate = new Date(),
): Date | null {
  const plan = schedule.find((p) => p.PM_NO === pmNo)
  if (!plan || plan.OBJSTATE === 'Obsolete') return null

  const intervalDays = intervalToDays(plan.INTERVAL, plan.PM_INTERVAL_UNIT)
  if (!intervalDays) return null

  const pmEh = ehWork.filter((w) => w.PM_NO === String(pmNo) && w.finished)
  if (pmEh.length > 0) {
    const last = pmEh.reduce(
      (max, w) => (w.finished! > max ? w.finished! : max),
      pmEh[0].finished!,
    )
    return addDays(last, intervalDays)
  }

  if (!plan.START_DATE) return null
  let next = plan.START_DATE
  while (next <= referenceDate) {
    next = addDays(next, intervalDays)
  }
  return next
}

export type LoadedData = {
  workOrders: WorkOrder[]
  alarms: Alarm[]
  schedule: MaintenancePlan[]
  reactive: WorkOrder[]
  scheduled: WorkOrder[]
}

let cache: LoadedData | null = null

export function loadAllData(): LoadedData {
  if (cache) return cache

  const workOrders = filterTargetSites(loadWorkOrders())
  const alarms = filterTargetSites(loadAlarms())
  const schedule = loadSchedule()

  cache = {
    workOrders,
    alarms,
    schedule,
    reactive: getReactiveRepairs(workOrders),
    scheduled: getScheduledWork(workOrders),
  }
  return cache
}
