import {
  ALARM_BASELINE_DAYS,
  ALARM_CANCEL_THRESHOLD,
  ALARM_SEND_NOW_THRESHOLD,
  ALARM_WINDOW_DAYS,
  DAYS_TO_NEXT_EH_CANCEL,
  DAYS_TO_NEXT_EH_SEND_NOW,
  RECOMMENDATION_LABELS,
  REACTIVE_AFTER_EH_DAYS,
  type RecommendationAction,
} from './config'
import {
  addDays,
  computeNextInspection,
  countAlarmsBefore,
  daysBetween,
  extractEquipmentCodes,
  loadAllData,
  type MaintenancePlan,
} from './data-loader'

export type Recommendation = {
  entityId: string
  entityLabel: string
  site: string
  siteNo: number
  alarms7d: number
  alarms30d: number
  alarmTrend: 'rising' | 'stable' | 'none'
  nextInspection: string | null
  daysToNextInspection: number | null
  action: RecommendationAction
  actionLabel: string
  pmNo?: number
  woNo?: string
}

const ACTION_PRIORITY: Record<RecommendationAction, number> = {
  SEND_NOW: 0,
  ACCELERATE_INSPECTION: 1,
  AUDIT_PLAN: 2,
  CANCEL_INSPECTION: 3,
  MONITOR: 4,
}

function isRoutinePlan(plan: MaintenancePlan): boolean {
  const desc = `${plan.ACTION_DESCR} ${plan.ACTION_DESCR_ENG}`.toLowerCase()
  return desc.includes('käyttöhuolto') || desc.includes('viikkokierros')
}

function classifyAction(
  alarms7d: number,
  alarms30d: number,
  daysToNext: number | null,
  hadReactiveAfterEh: boolean,
): RecommendationAction {
  if (hadReactiveAfterEh) return 'AUDIT_PLAN'
  if (
    alarms7d >= ALARM_SEND_NOW_THRESHOLD &&
    (daysToNext === null || daysToNext > DAYS_TO_NEXT_EH_SEND_NOW)
  ) {
    return 'SEND_NOW'
  }
  if (
    alarms7d === ALARM_CANCEL_THRESHOLD &&
    alarms30d === ALARM_CANCEL_THRESHOLD &&
    daysToNext !== null &&
    daysToNext <= DAYS_TO_NEXT_EH_CANCEL
  ) {
    return 'CANCEL_INSPECTION'
  }
  if (alarms7d >= 1 && alarms7d < ALARM_SEND_NOW_THRESHOLD && alarms7d > alarms30d / 4) {
    return 'ACCELERATE_INSPECTION'
  }
  return 'MONITOR'
}

export function buildRecommendations(referenceDate = new Date()): Recommendation[] {
  const { reactive, scheduled, alarms, schedule } = loadAllData()
  const results: Recommendation[] = []
  const seen = new Set<string>()

  const equipmentBySite = new Map<string, { codes: Set<string>; siteNo: number; site: string }>()
  for (const a of alarms) {
    if (!a.EVENT_TIME || a.EVENT_TIME < addDays(referenceDate, -ALARM_WINDOW_DAYS)) continue
    if (!a.isActionable) continue
    for (const code of a.equipmentCodes) {
      const key = `${a.CUSTOMER_SITE_NO}:${code}`
      const existing = equipmentBySite.get(key) ?? {
        codes: new Set<string>(),
        siteNo: a.CUSTOMER_SITE_NO,
        site: a.CUSTOMER_SITE_NAME,
      }
      existing.codes.add(code)
      equipmentBySite.set(key, existing)
    }
  }

  for (const [key, { codes, siteNo, site }] of equipmentBySite) {
    const siteAlarms = alarms.filter((a) => a.CUSTOMER_SITE_NO === siteNo)
    const cust = siteAlarms[0]?.CUSTOMER_NO ?? null
    const { unique: a7c } = countAlarmsBefore(
      alarms,
      cust,
      siteNo,
      referenceDate,
      ALARM_WINDOW_DAYS,
      codes,
    )
    const { unique: a30c } = countAlarmsBefore(
      alarms,
      cust,
      siteNo,
      referenceDate,
      ALARM_BASELINE_DAYS,
      codes,
    )
    if (a7c === 0 && a30c === 0) continue

    const relatedReactive = reactive.find(
      (r) =>
        r.CUSTOMER_SITE_NO === siteNo &&
        r.started &&
        r.started >= addDays(referenceDate, -30) &&
        Array.from(r.equipmentCodes).some((c) => codes.has(c)),
    )

    const ivPlan = schedule.find(
      (p) =>
        p.CUSTOMER_SITE_NO === siteNo &&
        p.OBJSTATE === 'Active' &&
        (p.ACTION_DESCR.includes('IV') || p.ACTION_DESCR_ENG.toLowerCase().includes('ventilation')),
    )
    const nextInsp = ivPlan
      ? computeNextInspection(ivPlan.PM_NO, schedule, scheduled, referenceDate)
      : null
    const daysToNext = nextInsp ? daysBetween(referenceDate, nextInsp) : null

    const action = classifyAction(a7c, a30c, daysToNext, false)
    if (action === 'MONITOR' && a7c < 3) continue

    if (seen.has(key)) continue
    seen.add(key)

    const code = Array.from(codes)[0] ?? key.split(':')[1] ?? key

    results.push({
      entityId: code,
      entityLabel: `${code} (${site})`,
      site,
      siteNo,
      alarms7d: a7c,
      alarms30d: a30c,
      alarmTrend: a7c > a30c / 4 ? 'rising' : a7c > 0 ? 'stable' : 'none',
      nextInspection: nextInsp?.toISOString().slice(0, 10) ?? null,
      daysToNextInspection: daysToNext,
      action,
      actionLabel: RECOMMENDATION_LABELS[action],
      pmNo: ivPlan?.PM_NO,
      woNo: relatedReactive?.WO_NO,
    })
  }

  for (const plan of schedule.filter((p) => p.OBJSTATE === 'Active' && !isRoutinePlan(p))) {
    const nextInsp = computeNextInspection(plan.PM_NO, schedule, scheduled, referenceDate)
    if (!nextInsp) continue
    const daysToNext = daysBetween(referenceDate, nextInsp)

    const siteAlarms = alarms.filter((a) => a.CUSTOMER_SITE_NO === plan.CUSTOMER_SITE_NO)
    const cust = siteAlarms[0]?.CUSTOMER_NO ?? 0
    const { unique: a7 } = countAlarmsBefore(
      alarms,
      cust,
      plan.CUSTOMER_SITE_NO,
      referenceDate,
      ALARM_WINDOW_DAYS,
    )
    const { unique: a30 } = countAlarmsBefore(
      alarms,
      cust,
      plan.CUSTOMER_SITE_NO,
      referenceDate,
      ALARM_BASELINE_DAYS,
    )

    const hadReactive = scheduled.some((eh) => {
      if (eh.PM_NO !== String(plan.PM_NO) || !eh.started || !eh.finished) return false
      return reactive.some(
        (r) =>
          r.CUSTOMER_SITE_NO === plan.CUSTOMER_SITE_NO &&
          r.started &&
          r.started > eh.finished! &&
          r.started <= addDays(eh.finished!, REACTIVE_AFTER_EH_DAYS),
      )
    })

    const action = classifyAction(a7, a30, daysToNext, hadReactive)
    const key = `pm:${plan.PM_NO}`
    if (seen.has(key)) continue
    if (action === 'MONITOR' && a7 === 0 && daysToNext > DAYS_TO_NEXT_EH_CANCEL) continue
    seen.add(key)

    results.push({
      entityId: `PM-${plan.PM_NO}`,
      entityLabel: `${plan.ACTION_DESCR} (${plan.customer_site_name})`,
      site: plan.customer_site_name,
      siteNo: plan.CUSTOMER_SITE_NO,
      alarms7d: a7,
      alarms30d: a30,
      alarmTrend: a7 > 0 ? 'rising' : 'none',
      nextInspection: nextInsp.toISOString().slice(0, 10),
      daysToNextInspection: daysToNext,
      action,
      actionLabel: RECOMMENDATION_LABELS[action],
      pmNo: plan.PM_NO,
    })
  }

  for (const woNo of ['54960238', '54716854', '54882174']) {
    const row = reactive.find((r) => r.WO_NO === woNo)
    if (!row?.started) continue
    const key = `wo:${woNo}`
    if (seen.has(key)) continue
    const { unique } = countAlarmsBefore(
      alarms,
      row.CUSTOMER_NO,
      row.CUSTOMER_SITE_NO,
      row.started,
    )
    seen.add(key)
    results.push({
      entityId: woNo,
      entityLabel: row.WORK_DESCRIPTION.slice(0, 60) || `WO ${woNo}`,
      site: row.customer_site_name,
      siteNo: row.CUSTOMER_SITE_NO,
      alarms7d: unique,
      alarms30d: unique,
      alarmTrend: 'rising',
      nextInspection: null,
      daysToNextInspection: null,
      action: 'SEND_NOW',
      actionLabel: RECOMMENDATION_LABELS.SEND_NOW,
      woNo,
    })
  }

  return results
    .sort((a, b) => {
      const pa = ACTION_PRIORITY[a.action] - ACTION_PRIORITY[b.action]
      if (pa !== 0) return pa
      return b.alarms7d - a.alarms7d
    })
    .slice(0, 50)
}

export function recommendationsToCsv(recs: Recommendation[]): string {
  const headers = [
    'entity_id',
    'entity_label',
    'site',
    'alarms_7d',
    'alarms_30d',
    'next_inspection',
    'days_to_next',
    'recommendation',
  ]
  const lines = [headers.join(',')]
  for (const r of recs) {
    lines.push(
      [
        r.entityId,
        `"${r.entityLabel.replace(/"/g, '""')}"`,
        `"${r.site}"`,
        r.alarms7d,
        r.alarms30d,
        r.nextInspection ?? '',
        r.daysToNextInspection ?? '',
        `"${r.actionLabel}"`,
      ].join(','),
    )
  }
  return lines.join('\n')
}

export { extractEquipmentCodes }
